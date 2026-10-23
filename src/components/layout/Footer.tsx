
import { Link } from "react-router-dom";
import { Heart, Globe, Mail, Phone, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-eco-green-700 bg-eco-green-800 text-white">
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <Globe className="h-6 w-6 text-eco-green-200" />
              <span className="text-xl font-bold text-white">ZeroWaste</span>
            </Link>
            <p className="text-sm text-eco-green-100">
              Connecting food donors with those in need to reduce waste and help communities.
            </p>
            <div className="flex items-center text-sm text-eco-green-100">
              <Heart className="h-4 w-4 mr-1 text-eco-green-200" />
              <span>Made with love for our planet</span>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/map" className="text-eco-green-100 transition-colors hover:text-white">
                  Find Food
                </Link>
              </li>
              <li>
                <Link to="/donate" className="text-eco-green-100 transition-colors hover:text-white">
                  Donate
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-eco-green-100 transition-colors hover:text-white">
                  Join Us
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-eco-green-100 transition-colors hover:text-white">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-white mb-4">Help</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/faq" className="text-eco-green-100 transition-colors hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-eco-green-100 transition-colors hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-eco-green-100 transition-colors hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-eco-green-100 transition-colors hover:text-white">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-white mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center text-eco-green-100">
                <Mail className="h-4 w-4 mr-2 text-eco-green-200" />
                <span>hello@zerowaste.org</span>
              </li>
              <li className="flex items-center text-eco-green-100">
                <Phone className="h-4 w-4 mr-2 text-eco-green-200" />
                <span>+1 (123) 456-7890</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-10 flex flex-col gap-2 border-t border-white/20 pt-6 text-center text-sm text-eco-green-100 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} ZeroWaste. All rights reserved.
          </p>
          <div className="font-medium tracking-wide text-white">
            <p>Built by BATHULA TEJA KUMAR</p>
            <a
              href="https://www.linkedin.com/in/teja-kumar-bathula/"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-eco-green-100 transition-colors hover:text-white"
            >
              <Linkedin className="h-4 w-4" aria-hidden="true" />
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
