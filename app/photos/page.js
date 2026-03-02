import { redirect } from "next/navigation";

export const metadata = {
  title: "Photos | 我的小小世界",
};

export default function PhotosPage() {
  redirect("/photos/index.html");
}
