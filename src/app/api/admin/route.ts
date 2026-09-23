import { reviewReport } from "@/server/actions";
import { handlePost, HttpError, text } from "@/server/http";
import { currentUser } from "@/server/session";

export async function POST(request: Request) {
  return handlePost(request, async (form) => {
    const user = await currentUser();
    if (!user || user.role !== "admin") throw new HttpError(404, "Fila não encontrada.");
    await reviewReport(user.id, text(form, "reportId"), text(form, "motivo"));
  }, "/admin");
}
