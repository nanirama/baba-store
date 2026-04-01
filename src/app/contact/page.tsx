import Link from "next/link";
import { BaseLayout } from "@/components/Common/BaseLayout";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default async function ContactPage() {
    return (
        <BaseLayout>
            <section className="w-full bg-[#2c3640] ">

                <div className="max-w-[1440px] mx-auto flex flex-col gap-4 px-4 sm:px-6 lg:px-8 py-10">
                    <Link href="https://www.facebook.com/www.baba.ge" className="flex flex-row gap-4 text-white text-xl font-medium items-center border-b border-[#3A4754] pb-4 w-full">
                        <div className="w-14 h-14 rounded-full border border-dashed border-[#F15A24] flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="28" height="28" viewBox="0 0 28 28" data-code="62074" data-tags="commenting"><g fill="#F15A24" transform="scale(0.02734375 0.02734375)"><path d="M365.714 512c0-40.571-32.571-73.143-73.143-73.143s-73.143 32.571-73.143 73.143 32.571 73.143 73.143 73.143 73.143-32.571 73.143-73.143zM585.143 512c0-40.571-32.571-73.143-73.143-73.143s-73.143 32.571-73.143 73.143 32.571 73.143 73.143 73.143 73.143-32.571 73.143-73.143zM804.571 512c0-40.571-32.571-73.143-73.143-73.143s-73.143 32.571-73.143 73.143 32.571 73.143 73.143 73.143 73.143-32.571 73.143-73.143zM1024 512c0 202.286-229.143 365.714-512 365.714-41.714 0-82.286-3.429-120.571-10.286-65.143 65.143-150.286 109.714-248.571 130.857-15.429 2.857-32 5.714-49.143 7.429-9.143 1.143-17.714-5.143-20-13.714v0c-2.286-9.143 4.571-14.857 11.429-21.143 36-33.714 78.857-60.571 93.714-181.143-109.143-66.857-178.857-166.286-178.857-277.714 0-202.286 229.143-365.714 512-365.714s512 163.429 512 365.714z" /></g></svg>
                        </div>
                        ჩატი Facebook-ით
                    </Link>
                    <Link href="/" className="flex flex-row gap-4 text-white text-xl font-medium items-center border-b border-[#3A4754] pb-4 w-full">
                        <div className="w-14 h-14 rounded-full border border-dashed border-[#F15A24] flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#F15A24" viewBox="0 0 24 24"><path d="M12 12.713l-11.985-9.713h23.97l-11.985 9.713zm0 2.574l-12-9.725v15.438h24v-15.438l-12 9.725z" /></svg>                        </div>
                        <div className="flex flex-col gap-2">
                            ელ. ფოსტა
                            <span className="text-sm text-[#8B9198]">hello@baba.ge</span>
                        </div>

                    </Link>
                    <Link href="/" className="flex flex-row gap-4 text-white text-xl font-medium items-center border-b border-[#3A4754] pb-4 w-full">
                        <div className="w-14 h-14 rounded-full border border-dashed border-[#F15A24] flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" width="28" height="28" fill="#F15A24" viewBox="0 0 24 24" clip-rule="evenodd"><path d="M12 10c-1.104 0-2-.896-2-2s.896-2 2-2 2 .896 2 2-.896 2-2 2m0-5c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3m-7 2.602c0-3.517 3.271-6.602 7-6.602s7 3.085 7 6.602c0 3.455-2.563 7.543-7 14.527-4.489-7.073-7-11.072-7-14.527m7-7.602c-4.198 0-8 3.403-8 7.602 0 4.198 3.469 9.21 8 16.398 4.531-7.188 8-12.2 8-16.398 0-4.199-3.801-7.602-8-7.602" /></svg>                        </div>
                        <div className="flex flex-col gap-2">
                            მისამართი
                            <span className="text-sm text-[#8B9198]">ი. ჭავჭავაძის გამზ. 55, თბილისი 0162</span>
                        </div>
                    </Link>
                </div>

            </section>
        </BaseLayout>
    )
}
