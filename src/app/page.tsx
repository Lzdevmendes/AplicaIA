import { redirect } from "next/navigation";

export default function Home() {
  // O middleware já mandou para /login quem não está autenticado.
  redirect("/nova");
}
