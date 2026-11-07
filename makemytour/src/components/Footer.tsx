import React from "react";
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
const Footer = () => {
  return (
    <footer className="bg-black text-gray-300 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Why Kalyan Travels Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div>
            <h3 className="text-xl font-bold mb-4">Why Kalyan Travels?</h3>
            <p className="text-sm leading-relaxed">
              Established with a passion for world-class tourism, Kalyan Travels
              has since positioned itself as a leading travel partner, providing great
              offers, competitive airfares, exclusive discounts, and a seamless
              online booking experience.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">
              Booking Flights with Kalyan Travels
            </h3>
            <p className="text-sm leading-relaxed">
              Book your flight tickets with India's trusted travel booking
              platform. Get the best deals on domestic & international flights,
              premium hotels, and curated holiday packages.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">
              Domestic Flights with Kalyan Travels
            </h3>
            <p className="text-sm leading-relaxed">
              Kalyan Travels is your go-to partner for effortless flight bookings.
              With lowest fare guarantees and real-time updates, experience great
              value on every trip.
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="font-semibold mb-3">ABOUT THE SITE</h4>
            <ul className="text-sm space-y-2">
              <li>
                <a href="#" className="hover:text-white">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Investor Relations
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Careers
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">POPULAR HOTELS</h4>
            <ul className="text-sm space-y-2">
              <li>
                <a href="#" className="hover:text-white">
                  Hotels in Delhi
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Hotels in Mumbai
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Hotels in Goa
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">QUICK LINKS</h4>
            <ul className="text-sm space-y-2">
              <li>
                <a href="#" className="hover:text-white">
                  COVID-19 Update
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Flight Schedule
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Train Schedule
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">IMPORTANT LINKS</h4>
            <ul className="text-sm space-y-2">
              <li>
                <a href="#" className="hover:text-white">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  User Agreement
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links & Copyright */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-6 mb-4 md:mb-0">
              <a href="#" className="hover:text-white">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-white">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-white">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-white">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
            <p className="text-sm">
              © {new Date().getFullYear()} Kalyan Travels PVT. LTD. All rights reserved
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
