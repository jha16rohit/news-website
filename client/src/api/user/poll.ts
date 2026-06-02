import { apiClient } from "../client";

export const votePoll = async (
  newsId: string,
  updateId: string,
  optionId: string
) => {
  return apiClient(
    `/api/news/${newsId}/live-update/${updateId}/vote`,
    {
      method: "POST",

      body: JSON.stringify({
        optionId,
      }),
    }
  );
};