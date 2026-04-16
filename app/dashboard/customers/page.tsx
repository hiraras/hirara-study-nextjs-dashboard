import { fetchRevenue } from "@/app/lib/data";

export default async function Page() {
    const revenue = await fetchRevenue();
    return <div>Customers Page</div>;
}
