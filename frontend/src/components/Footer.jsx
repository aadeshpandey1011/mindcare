export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h4 className="font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
            <li><a href="/privacy">Privacy</a></li>
            <li><a href="/faq">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Helpline</h4>
          <p className="text-sm">Suicide Prevention</p>
          <p className="text-sm">Counselor</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Newsletter</h4>
          <form className="flex">
            <input
              type="email"
              placeholder="Enter email"
              className="p-2 w-full rounded-l bg-gray-800 text-white"
            />
            <button className="bg-blue-600 px-4 rounded-r">Subscribe</button>
          </form>
        </div>
      </div>
      <div className="mt-8 text-center text-sm text-gray-500">
        © 2025 MindCare. All rights reserved.
      </div>
    </footer>
  );
}