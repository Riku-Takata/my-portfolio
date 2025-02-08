const Footer = () => {
  return (
    <footer className="bg-background text-[#453F3C] py-8">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; {new Date().getFullYear()} Riku Takata. All rights reserved.</p>
        <p className="mt-2">
          <a href="/privacy-policy" className="hover:underline">
            Privacy Policy
          </a>{" "}
          |
          <a href="/terms-of-service" className="hover:underline ml-2">
            Terms of Service
          </a>
        </p>
        <p className="mt-4 text-sm">Designed and built with passion</p>
      </div>
    </footer>
  )
}

export default Footer

