import Link from "next/link";
import { BaseLayout } from "@/components/Common/BaseLayout";
import { Button } from "@/components/ui/button";

export default async function OnlineGanvadebaPage() {
    return (
        <BaseLayout>
            <section className="w-full bg-[#f5f5f5] border-t border-gray-200">


                {/* Title */}
                <div className="mb-6 page_ttl relative">
                    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
                        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 relative inline-block ">
                            ონლაინ განვადება
                            <span className="absolute left-0 -bottom-5 w-20 h-[1px] bg-[#F15A24] z-10"></span>
                        </h2>
                    </div>
                </div>
                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-16">
                    {/* Left Text */}
                    <div className="text-gray-700 text-sm sm:text-base leading-relaxed space-y-4 md:col-span-2">
                        <p className="font-semibold">SPACE QR განვადება</p>
                        <p>SPACE განვადების სანახავად დააწკაპუნეთ ამ <Link href="https://www.youtube.com/watch?v=ZjBzIeJzqFk" className="text-[#F15A24] underline"> ვიდეო ინსტრუქციაზე</Link></p>
                        <p>SPACE-ის განვადების გამოსაყენებლად აუცილებელია თქვენს მობილურში გადმოწეროთ Space Bank-ის აპლიკაცია.</p>
                        <p>IOS-  <Link href="https://apps.apple.com/us/app/space-digital-banking/id1334713643" className="text-[#007bff] underline">https://apps.apple.com/us/app/space-digital-banking/id1334713643</Link></p>
                        <p>Android - <Link href="https://play.google.com/store/apps/details?id=ge.space.app&hl=en&pli=1" className="text-[#007bff] underline">https://play.google.com/store/apps/details?id=ge.space.app&hl=en</Link></p>
                        <ol className="list-decimal list-inside pt-6 space-y-4">
                            <li>გავიაროთ რეგისტრაცია.</li>
                            <li>ბრუნდებით ჩვენს გვერდზე, ირჩევთ ნივთს, აჭერთ ყიდვას და ირჩევთ სფეისის QR განვადებას, რომელსაც გადაჰყავხართ SPACE BANK-ის განვადების პორტალში, სადაც ჩნდება QR კოდი, რომელსაც ასკანერებთ თქვენი სმარტფონით სფეისის მობილური აპლიკაციის გამოყენებით.</li>
                        </ol>

                    </div>

                    {/* Right Empty / Divider Area */}
                    <div className="hidden md:block border-l border-gray-300 h-full"></div>
                </div>

            </section>
        </BaseLayout>
    )
}
