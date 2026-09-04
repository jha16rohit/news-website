import { useEffect, useState } from "react";
import { getPublicCategories } from "../api/user/categoryNews";
import type { Category } from "../types/category";

export const useCategories = () => {
  const [categories, setCategories] =
    useState<Category[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const data =
          await getPublicCategories();

        setCategories(data);

      } catch (error) {
        console.error(
          "Error fetching categories:",
          error
        );
      }
    }

    fetchData();
  }, []);

  return { categories };
};