import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import type { User } from "@/app/lib/definitions";
import bcrypt from "bcrypt";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function getUser(email: string): Promise<User | undefined> {
    try {
        const user = await sql<
            User[]
        >`SELECT * FROM users WHERE email=${email}`;
        return user[0];
    } catch (error) {
        console.error("Failed to fetch user:", error);
        throw new Error("Failed to fetch user.");
    }
}

// auth() = 在服务端读取当前请求对应的 session/user
export const { auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({
                        email: z.string().email(),
                        password: z.string().min(6),
                    })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null;
                    const passwordsMatch = await bcrypt.compare(
                        password,
                        user.password,
                    );

                    if (passwordsMatch) return user;
                }

                return null;
            },
        }),
    ],
});

/**
 * 只要配置了GIthub的provider就能实现github的第三方登陆了吗？如果同时配置多个，它们会都支持？配置多个之后signIn的调用是否需要写一些兼容代码？
 * 基本是这样：

- **只配 `GitHub` provider 不够“直接可用”**，还需要：
  - GitHub OAuth App 的 `clientId/clientSecret`
  - 回调地址配置正确
  - NextAuth 环境变量（如 `AUTH_SECRET`）就绪  
  配齐后就能用 GitHub 第三方登录。

- **可以同时配置多个 provider**，会同时支持（例如 GitHub + Google + Credentials）。

- **`signIn` 调用需要按 provider 区分**：
  - 第三方 OAuth：`signIn("github")`、`signIn("google")`
  - Credentials：`signIn("credentials", formData)`（或传 email/password）
  
所以“兼容代码”不复杂，核心是：
- UI 上给不同登录方式不同按钮
- 每个按钮调用对应 provider id
- 若有统一登录入口，就根据用户选择传不同 id 即可。
 */
