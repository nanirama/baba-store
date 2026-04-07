import Link from "next/link";
import { BaseLayout } from "@/components/Common/BaseLayout";
import { Button } from "@/components/ui/button";

export default async function AboutUsPage() {
    return (
        <BaseLayout>
            <section className="w-full bg-[#f5f5f5] border-t border-gray-200">


                {/* Title */}
                <div className="mb-6 page_ttl relative">
                    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
                        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 relative inline-block ">
                            ჩვენს შესახებ
                            <span className="absolute left-0 -bottom-5 w-20 h-[1px] bg-[#F15A24] z-10"></span>
                        </h2>
                    </div>
                </div>
                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-16">
                        {/* Left Text */}
                        <div className="text-gray-700 text-sm sm:text-base leading-relaxed space-y-4 md:col-span-2">
                            <p>
                                Baba Ge წარმოადგენს ინოვაციურ მაღაზიას, სადაც მომხმარებელი მიიღებს
                                მაღალი ხარისხის პროდუქციას.
                            </p>
                            <p>
                                ჩვენს მაღაზიაში, შეგიძლიათ შეიძინოთ სხვადასხვა კატეგორიის პროდუქტები,
                                როგორიცაა: ტექნიკა, ავეჯი, აქსესუარები, სამშენებლო მასალები და სხვა
                                პროდუქცია. ჩვენი მიზანია მომხმარებელს შევთავაზოთ საუკეთესო სერვისი
                                და ხარისხი.
                            </p>
                        </div>

                        {/* Right Empty / Divider Area */}
                        <div className="hidden md:block border-l border-gray-300 h-full"></div>
                    </div>

            </section>
        </BaseLayout>
    )
}
