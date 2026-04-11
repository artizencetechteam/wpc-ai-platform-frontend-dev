import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access-token")?.value;
  const userInfoCookie = cookieStore.get("user-info")?.value;

  if (accessToken) {
    let dashboardPath = "/employer/dashboard";
    if (userInfoCookie) {
      try {
        const userInfo = JSON.parse(decodeURIComponent(userInfoCookie));
        if (userInfo.role) {
          dashboardPath = `/${userInfo.role}/dashboard`;
        }
      } catch (e) {
        console.error("Home: Error parsing user-info cookie", e);
      }
    }
    redirect(dashboardPath);
  }

  redirect("/auth/employer/login");
}
