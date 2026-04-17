import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login", // 当 authorized 返回 false、或 NextAuth 认为需要让用户登录时，会重定向到这个地址
    },
    callbacks: {
        /**
         * 说明：
         * - 命中 proxy.ts matcher 的请求，主要会触发 authorized（用于路由放行/拦截/重定向）。
         * - callbacks 里的其他方法不会对每个 matcher 请求都执行，
         *   而是在各自生命周期触发时运行：
         *   - signIn: 登录提交时
         *   - jwt: 创建/更新 token 时
         *   - session: 读取/返回 session 时
         *   - redirect: 发生重定向决策时
         */
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                return Response.redirect(new URL("/dashboard", nextUrl));
            }
            return true;
        },
    },
    providers: [],
} satisfies NextAuthConfig;
