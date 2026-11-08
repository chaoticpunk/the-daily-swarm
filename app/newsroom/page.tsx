import type { Metadata } from "next";
import { NewsroomApp } from "@/components/newsroom/NewsroomApp";

export const metadata: Metadata = {
  title: "Newsroom",
  description:
    "Produce an edition: three desks pitch, the editor commissions two, the stories are written and checked, and the edition goes to press for 1 testnet NEAR.",
};

export default function NewsroomPage() {
  return <NewsroomApp />;
}
