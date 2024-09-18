'use client'
import Footer from '@/app/components/Footer';
import Header from '@/app/components/Header';
import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="h-screen bg-white">
      <Header />
      <div class="bg-white p-10 content-center items-center text-center flex flex-col">
        <SignUp />
      </div>
      <Footer />
    </div>
  );
}