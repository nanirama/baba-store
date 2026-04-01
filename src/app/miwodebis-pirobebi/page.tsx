import Link from "next/link";
import { BaseLayout } from "@/components/Common/BaseLayout";
import { Button } from "@/components/ui/button";

export default async function DeliveryPage() {
    return (
        <BaseLayout>
            <section className="w-full bg-[#f5f5f5] border-t border-gray-200">


                {/* Title */}
                <div className="mb-6 page_ttl relative">
                    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
                        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 relative inline-block ">
                            მიწოდების პირობები
                            <span className="absolute left-0 -bottom-5 w-20 h-[1px] bg-[#F15A24] z-10"></span>
                        </h2>
                    </div>
                </div>
                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-16">
                    {/* Left Text */}
                    <div className="text-gray-700 text-sm sm:text-base leading-relaxed space-y-4 md:col-span-2">
                        <p>
                            ვებგვერდზე baba.ge პროდუქციის შეძენის შემთხვევაში მომხმარებელი ადგილზე მიტანის სერვისით სარგებლობს უფასოდ.
                        </p>
                        <p>
                            როდესაც მომხმარებლის მიერ ხორციელდება როგორც წვრილი, ისე მსხვილი ტექნიკის შეძენა მიწოდება ხდება 3 სამუშაო დღეში თბილისში, ხოლო რეგიონებში 4-7 სამუშაო დღეში. მიწოდება არის უფასო.
                        </p>
                        <p>თუ ჩვენს ვებგვერდზე თქვენს შეკვეთას აქვს სტატუსი ჩაბარებული და თქვენ არ მიგიღიათ გზავნილი,  გთხოვთ დაუყოვნებლივ მოგვწეროთ ამ ფაქტის შესახებ (იმეილზე: hello@baba.ge) და პრობლემის დაფიქსირების შემდეგ კომპანია იზრუნებს ნებისმიერი გაუგებრობის/ხარვეზის დროულად აღმოფხვრაზე.</p>
                        <p>ინტერნეტ მაღაზიის გამოყენებისას თქვენ ეთანხმებთ ამ პირობებს. Baba.ge პასუხს აგებს ნივთის გადაზიდვის შედეგად დამდგარ ზიანზე, თუმცა მომხმარებელი ვალდებულია, აცნობოს shop.baba.ge-ს ნებისმიერი არასასურველი  გარემოების შესახებ და კომპანია იტოვებს უფლებას, თვითონ მიიღოს საბოლოო გადაწყვეტილება დაფიქსირებული პრობლემის თაობაზე.</p>
                    </div>

                    {/* Right Empty / Divider Area */}
                    <div className="hidden md:block border-l border-gray-300 h-full"></div>
                </div>

            </section>
        </BaseLayout>
    )
}
