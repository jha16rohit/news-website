import { useEffect, useState } from "react";
import { getCategories } from "../api/category.api";
import type { Category } from "../types/category";

export const useCategories = () => {
  const [categories, setCategories] =
    useState<Category[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const data =
          await getCategories();

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