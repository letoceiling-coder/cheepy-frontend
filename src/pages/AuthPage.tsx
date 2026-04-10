import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import AuthPageContent from "@/components/page-blocks/auth/AuthPageContent";

const AuthPage = () => {
  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main className="px-4 py-8">
        <AuthPageContent />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default AuthPage;
