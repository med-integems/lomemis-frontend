"use client";

import { useQuery } from "@tanstack/react-query";

interface DistrictResponse {
  success?: boolean;
  data?: unknown;
}

// Static fallback districts based on Sierra Leone's administrative divisions
const FALLBACK_DISTRICTS = [
  "Bo",
  "Bombali",
  "Bonthe",
  "Falaba",
  "Kailahun",
  "Kambia",
  "Karene",
  "Kenema",
  "Koinadugu",
  "Kono",
  "Moyamba",
  "Port Loko",
  "Pujehun",
  "Tonkolili",
  "Western Area Rural",
  "Western Area Urban",
];

const API_PATH = "/api/local-councils/districts";

function normalizeDistricts(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return FALLBACK_DISTRICTS;
  }

  const normalized = input
    .map((district) =>
      typeof district === "string" ? district.trim() : undefined
    )
    .filter((district): district is string => !!district);

  return normalized.length > 0 ? normalized : FALLBACK_DISTRICTS;
}

export function useDistricts() {
  return useQuery<string[], Error>({
    queryKey: ["districts"],
    queryFn: async () => {
      if (typeof window === "undefined") {
        return FALLBACK_DISTRICTS;
      }

      const token = localStorage.getItem("auth_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const requestUrl = apiUrl + API_PATH;

      if (!token) {
        console.warn("Districts: missing auth token, using fallback list");
        return FALLBACK_DISTRICTS;
      }

      try {
        const response = await fetch(requestUrl, {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.warn("Districts API failed, using fallback list");
          return FALLBACK_DISTRICTS;
        }

        const data: DistrictResponse = await response.json();

        if (!data?.success) {
          console.warn("Districts API returned error, using fallback list");
          return FALLBACK_DISTRICTS;
        }

        return normalizeDistricts(data.data);
      } catch (error) {
        console.warn("Districts API error, using fallback list:", error);
        return FALLBACK_DISTRICTS;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Reduce retries since we have fallback
    initialData: FALLBACK_DISTRICTS,
  });
}
