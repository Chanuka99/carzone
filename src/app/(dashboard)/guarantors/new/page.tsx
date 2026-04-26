import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NewGuarantorClient from "./NewGuarantorClient";

export const metadata = {
  title: "Add Guarantor | DriveEase",
};

export default function NewGuarantorPage() {
  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/guarantors" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="page-title">Add Guarantor</h1>
          <p className="page-subtitle">Register a new guarantor</p>
        </div>
      </div>
      <NewGuarantorClient />
    </div>
  );
}
