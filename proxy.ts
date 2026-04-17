import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

// 浏览器或客户端发起请求命中matcher中的路径时，会触发这个代理，Edge上会执行这段auth，其中会运行callbacks.authorized
export const config = {
    // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
    matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
