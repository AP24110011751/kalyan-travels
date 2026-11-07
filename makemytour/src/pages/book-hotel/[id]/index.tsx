import { useRouter } from "next/router";
import {
  Star,
  MapPin,
  School as Pool,
  UtensilsCrossed,
  Wine,
  Power,
  ChevronRight,
  Camera,
  Image,
  CreditCard,
  Ticket,
  Plane,
  Home,
} from "lucide-react";
import { useEffect, useState } from "react";
import { gethotel, handlehotelbooking } from "@/api";
import ReviewSection from "@/components/ReviewSection";
import RoomTypeGrid from "@/components/RoomTypeGrid";
import DynamicPricing from "@/components/DynamicPricing";
import { recordInteraction } from "@/lib/recommendations";
interface Hotel {
  id: string; // Unique identifier for the hotel
  hotelName: string; // Name of the hotel
  location: string; // Location of the hotel
  pricePerNight: number; // Price per night
  availableRooms: number; // Number of available rooms
  amenities: string; // Amenities provided (comma-separated string or change to string[])
}
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDispatch, useSelector } from "react-redux";
import SignupDialog from "@/components/SignupDialog";
import Loader from "@/components/Loader";
import { setUser } from "@/store";
import PaymentModal from "@/components/PaymentModal";
const BookHotelPage = () => {
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const { id } = router.query; // Access the hotel ID from the URL
  const [hotels, sethotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector((state: any) => state.user.user);
  const [open, setOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const dispatch = useDispatch();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAmenities, setShowAmenities] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<"standard" | "deluxe" | "suite">("standard");
  const [roomExtraCostPerRoom, setRoomExtraCostPerRoom] = useState(0);
  const [dynamicPrice, setDynamicPrice] = useState<number | null>(null);
  useEffect(() => {
    const fetchhotels = async () => {
      try {
        const data = await gethotel();
        const filteredData = data.filter((hotel: any) => (hotel.id === id || hotel._id === id));
        if (filteredData.length > 0) {
          sethotels(filteredData);
        } else if (data.length > 0) {
          sethotels([data[0]]);
        }
        // ✅ Personalized Recommendations — Task 6: log this view for the affinity profile
        if ((filteredData[0] || data[0])?.location) {
          recordInteraction("viewed", "hotel", (filteredData[0] || data[0]).location);
        }
      } catch (error) {
        console.error("Error fetching flights:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchhotels();
  }, [id, user]);

  if (loading) {
    return <Loader />;
  }
  if (hotels.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">No hotel data available for this ID.</div>;
  }
  const hotel = hotels[0];
  const hotelData = {
    name: hotel?.hotelName || "Hotel",
    rating: 3,
    maxRating: 5,
    propertyPhotos: 91,
    guestPhotos: 386,
    description:
      `${hotel?.hotelName || "This hotel"} is located in ${hotel?.location || "a prime location"}, offering world-class amenities and exceptional hospitality for all travelers.`,
    amenities: [
      { icon: <Pool className="w-5 h-5" />, name: "Swimming Pool" },
      { icon: <UtensilsCrossed className="w-5 h-5" />, name: "Restaurant" },
      { icon: <Wine className="w-5 h-5" />, name: "Bar" },
      { icon: <Power className="w-5 h-5" />, name: "Power Backup" },
    ],
    room: {
      type: "Standard Room",
      capacity: "Fits 2 Adults",
      features: [
        "No meals included",
        "10% off on food & beverage services",
        "Complimentary welcome drinks on arrival",
        "Non-Refundable",
      ],
      originalPrice: 8999,
      discountedPrice: 664,
      taxes: 527,
    },
    location: {
      area: "Candolim",
      distance: "7 minutes walk to Candolim Beach",
    },
    reviews: {
      rating: 3.8,
      count: 784,
      text: "Very Good",
    },
  };
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const value = Number.parseInt(e.target.value);
    setQuantity(
      isNaN(value) ? 1 : Math.max(1, Math.min(value, hotel.availableRooms))
    );
  };

  const unitPricePerNight = dynamicPrice ?? hotel?.pricePerNight ?? 0;
  const totalPrice = unitPricePerNight * quantity;
  const totalTaxes = hotelData?.room.taxes * quantity;
  const totalDiscounts = hotelData?.room.discountedPrice * quantity;
  const roomUpgradeCost = roomExtraCostPerRoom * quantity;
  const grandTotal = totalPrice + totalTaxes - totalDiscounts + roomUpgradeCost;
  const handlebooking = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const data = await handlehotelbooking(
        user?.id,
        hotel?.id,
        quantity,
        grandTotal
      );
      // ✅ Seat & Room Selection — Task 4: persist chosen room type against this booking
      try {
        const roomBookings = JSON.parse(
          window.localStorage.getItem("mmt_room_bookings") || "{}"
        );
        roomBookings[data?.bookingId || data?.id || `${hotel.id}-${Date.now()}`] =
          selectedRoomType;
        window.localStorage.setItem(
          "mmt_room_bookings",
          JSON.stringify(roomBookings)
        );
      } catch {
        // non-critical, ignore storage errors
      }
      // ✅ Personalized Recommendations — Task 6: booking is a strong affinity signal
      if (hotel?.location) {
        recordInteraction("booked", "hotel", hotel.location);
      }
      const updateuser = {
        ...user,
        bookings: [...(user?.bookings || []), data],
      };
      dispatch(setUser(updateuser));
      setOpen(false);
      setQuantity(1);
      router.push("/profile");
    } catch (error) {
      console.log(error);
    }
  };
  const HotelContent = () => (
    <DialogContent className="sm:max-w-[600px] bg-white">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold flex items-center">
          <Home className="w-6 h-6 mr-2" />
          Hotel Booking Details
        </DialogTitle>
      </DialogHeader>
      <div className="grid gap-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hotel Name */}
          <div className="space-y-2">
            <Label htmlFor="hotelName" className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Hotel Name
            </Label>
            <Input id="hotelName" value={hotel.hotelName} readOnly />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Location
            </Label>
            <Input id="location" value={hotel.location} readOnly />
          </div>
          {/* Price Per Night */}
          <div className="space-y-2">
            <Label htmlFor="pricePerNight" className="flex items-center">
              <Ticket className="w-4 h-4 mr-2" />
              Price Per Night
            </Label>
            <Input
              id="pricePerNight"
              value={`₹ ${hotel.pricePerNight}`}
              readOnly
            />
          </div>

          {/* Available Rooms */}
          <div className="space-y-2">
            <Label htmlFor="availableRooms" className="flex items-center">
              <Ticket className="w-4 h-4 mr-2" />
              Available Rooms
            </Label>
            <Input id="availableRooms" value={hotel.availableRooms} readOnly />
          </div>

          {/* Number of Rooms to Book */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="flex items-center">
              <Ticket className="w-4 h-4 mr-2" />
              Number of Rooms to Book
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={hotel.availableRooms}
              value={quantity}
              onChange={handleQuantityChange}
            />
          </div>
        </div>
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Fare Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Base Fare</span>
              <span className="font-medium">
                ₹ {totalPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Taxes and Extracharges</span>
              <span className="font-medium">
                ₹ {totalTaxes.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-green-600">
              <span className="font-medium">Discounts</span>
              <span className="font-medium">
                - ₹ {Math.abs(totalDiscounts).toLocaleString()}
              </span>
            </div>
            {roomUpgradeCost > 0 && (
              <div className="flex justify-between items-center text-purple-600">
                <span className="font-medium">Room Upgrade ({selectedRoomType})</span>
                <span className="font-medium">
                  + ₹ {roomUpgradeCost.toLocaleString()}
                </span>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total Amount</span>
                <span className="font-bold text-lg">
                  ₹ {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Button
        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        onClick={() => {
          setOpen(false);
          setShowPaymentModal(true);
        }}
      >
        Proceed to Payment
      </Button>
    </DialogContent>
  );
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 text-sm">
            <a href="/" className="text-blue-500">
              Home
            </a>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <a href="/" className="text-blue-500">
              {hotel?.location}
            </a>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{hotel?.hotelName}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Hotel Title & Rating */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">{hotel.hotelName}</h1>
              <div className="flex items-center space-x-1">
                {[...Array(hotelData.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-current"
                  />
                ))}
                {[...Array(hotelData.maxRating - hotelData.rating)].map(
                  (_, i) => (
                    <Star key={i} className="w-5 h-5 text-gray-300" />
                  )
                )}
              </div>
            </div>

            {/* Image Gallery */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="col-span-2 relative group cursor-pointer">
                <img
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800"
                  alt="Hotel Main"
                  className="w-full h-80 object-cover rounded-lg"
                />
                <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded-full flex items-center space-x-1">
                  <Camera className="w-4 h-4" />
                  <span className="text-sm">
                    +{hotelData.propertyPhotos} Property Photos
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="relative group cursor-pointer">
                  <img
                    src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800"
                    alt="Hotel Room"
                    className="w-full h-[152px] object-cover rounded-lg"
                  />
                </div>
                <div className="relative group cursor-pointer">
                  <img
                    src="https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800"
                    alt="Hotel Amenity"
                    className="w-full h-[152px] object-cover rounded-lg"
                  />
                  <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded-full flex items-center space-x-1">
                    <Image className="w-4 h-4" />
                    <span className="text-sm">
                      +{hotelData.guestPhotos} Guest Photos
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-6">
              {isExpanded
                ? `${hotelData.description} Located in a peaceful neighborhood, this premium property offers unmatched hospitality and convenient access to local attractions. Relax in well-furnished rooms featuring elegant decor, modern bathrooms, and scenic views. Guests can experience delectable dining at the on-site restaurant serving local and international delicacies, unwind by the pool, or stay active at our fitness center.`
                : hotelData.description}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-500 ml-2 font-medium hover:underline"
              >
                {isExpanded ? "Read less" : "Read more"}
              </button>
            </p>

            {/* Amenities */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Amenities</h2>
              <div className="flex flex-wrap gap-6">
                {hotelData.amenities.map((amenity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 text-gray-600"
                  >
                    {amenity.icon}
                    <span>{amenity.name}</span>
                  </div>
                ))}
                <Dialog open={showAmenities} onOpenChange={setShowAmenities}>
                  <DialogTrigger asChild>
                    <button className="text-blue-500 hover:underline font-medium">+ 31 Amenities</button>
                  </DialogTrigger>
                  <DialogContent className="bg-white max-w-lg p-6 rounded-xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold">All Amenities</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-800 border-b pb-1">Basic Facilities</h3>
                        <p className="text-sm text-gray-600">• High-speed Wi-Fi (Free)</p>
                        <p className="text-sm text-gray-600">• 24-hour Room Service</p>
                        <p className="text-sm text-gray-600">• Air Conditioning</p>
                        <p className="text-sm text-gray-600">• Daily Housekeeping</p>
                        <p className="text-sm text-gray-600">• Power Backup</p>
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-800 border-b pb-1">Food & Drinks</h3>
                        <p className="text-sm text-gray-600">• Multi-cuisine Restaurant</p>
                        <p className="text-sm text-gray-600">• Bar & Lounge</p>
                        <p className="text-sm text-gray-600">• Cafe & Coffee Shop</p>
                        <p className="text-sm text-gray-600">• Free Breakfast Options</p>
                      </div>
                      <div className="space-y-3 mt-2">
                        <h3 className="font-semibold text-gray-800 border-b pb-1">Wellness & Activities</h3>
                        <p className="text-sm text-gray-600">• Outdoor Swimming Pool</p>
                        <p className="text-sm text-gray-600">• Fitness Center / Gym</p>
                        <p className="text-sm text-gray-600">• Full-service Spa</p>
                        <p className="text-sm text-gray-600">• Massage Center</p>
                      </div>
                      <div className="space-y-3 mt-2">
                        <h3 className="font-semibold text-gray-800 border-b pb-1">Other Services</h3>
                        <p className="text-sm text-gray-600">• Free Parking</p>
                        <p className="text-sm text-gray-600">• Laundry Service</p>
                        <p className="text-sm text-gray-600">• Doctor on Call</p>
                        <p className="text-sm text-gray-600">• Luggage Storage</p>
                        <p className="text-sm text-gray-600">• Airport Shuttle (Paid)</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* ✅ Dynamic Pricing Engine — Task 5 */}
            <DynamicPricing
              entityKey={`hotel-${hotel.id}`}
              basePrice={hotel.pricePerNight}
              unitLabel="per night"
              onPriceChange={setDynamicPrice}
            />

            {/* ✅ Room Selection — Task 4 */}
            <RoomTypeGrid
              hotelId={hotel.id}
              basePricePerNight={unitPricePerNight}
              roomsNeeded={quantity}
              onChange={(roomType, extraCost) => {
                setSelectedRoomType(roomType);
                setRoomExtraCostPerRoom(extraCost);
              }}
            />

            {/* Reviews & Ratings */}
            <div id="reviews-section">
              <ReviewSection
                entityKey={`hotel-${hotel.id}`}
                entityLabel={hotel.hotelName}
              />
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">
                {hotelData.room.type}
              </h3>
              <p className="text-gray-600 mb-4">{hotelData.room.capacity}</p>

              <ul className="space-y-3 mb-6">
                {hotelData.room.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mb-6">
                {/* Price Per Night */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-800 font-semibold">
                    Price Per Night:
                  </span>
                  <span className="text-lg font-medium text-gray-800">
                    ₹ {totalPrice}
                  </span>
                </div>

                {/* Available Rooms */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-800 font-semibold">
                    Available Rooms:
                  </span>
                  <span className="text-lg font-medium text-gray-800">
                    {hotel.availableRooms}
                  </span>
                </div>

                {/* Amenities */}
                <div>
                  <h4 className="text-gray-800 font-semibold mb-2">
                    Amenities:
                  </h4>
                  <p className="text-gray-600">{hotel.amenities}</p>
                </div>
              </div>
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 line-through">
                    ₹ {totalPrice}
                  </span>
                  <span className="text-gray-500">Per Night:</span>
                </div>
                <div className="flex items-center justify-between text-2xl font-bold">
                  <span>₹ {grandTotal}</span>
                  <span className="text-sm text-gray-500 font-normal">
                    + ₹ {totalTaxes} taxes & fees
                  </span>
                </div>
                {roomUpgradeCost > 0 && (
                  <p className="text-xs text-purple-600 font-medium mt-1">
                    Includes +₹{roomUpgradeCost.toLocaleString()} for {selectedRoomType} room upgrade
                  </p>
                )}
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <button className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors mb-3">
                    BOOK THIS NOW
                  </button>
                </DialogTrigger>
                {user ? (
                  <HotelContent />
                ) : (
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle>Login Required</DialogTitle>
                    </DialogHeader>
                    <p>Please log in to continue with your booking.</p>
                    <SignupDialog
                      trigger={
                        <Button className="w-full">Log In / Sign Up</Button>
                      }
                    />
                  </DialogContent>
                )}
              </Dialog>

              <Dialog open={showOptions} onOpenChange={setShowOptions}>
                <DialogTrigger asChild>
                  <button className="w-full text-blue-500 text-center hover:underline font-medium">
                    14 More Options
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-white max-w-xl p-6 rounded-xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">More Room Options</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
                    {[
                      { type: "Deluxe Ocean View", price: hotel.pricePerNight * 1.2, cap: "Fits 2 Adults, 1 Child", meal: "Breakfast Included" },
                      { type: "Executive Suite", price: hotel.pricePerNight * 1.5, cap: "Fits 3 Adults", meal: "Breakfast & Dinner Included" },
                      { type: "Presidential Luxury Suite", price: hotel.pricePerNight * 2.2, cap: "Fits 4 Adults", meal: "All Meals Included" },
                    ].map((room, idx) => (
                      <div key={idx} className="border p-4 rounded-lg flex items-center justify-between flex-wrap gap-3 hover:border-blue-400 transition-colors">
                        <div className="text-left">
                          <h4 className="font-semibold text-lg">{room.type}</h4>
                          <p className="text-xs text-gray-500">{room.cap}</p>
                          <span className="inline-block mt-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded">
                            {room.meal}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 line-through">₹ {Math.round(room.price * 1.2).toLocaleString()}</div>
                          <div className="font-bold text-lg text-blue-600">₹ {Math.round(room.price).toLocaleString()}</div>
                          <button
                            onClick={() => {
                              setShowOptions(false);
                              setQuantity(1);
                              setOpen(true);
                            }}
                            className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded mt-2 hover:bg-blue-700 transition-colors font-semibold"
                          >
                            Select Room
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Rating Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-500 text-white text-2xl font-bold w-16 h-16 rounded-lg flex items-center justify-center">
                    {hotelData.reviews.rating}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">
                      {hotelData.reviews.text}
                    </div>
                    <div className="text-gray-500">
                      ({hotelData.reviews.count} ratings)
                    </div>
                  </div>
                </div>
                <a href="#reviews-section" className="text-blue-500">
                  All Reviews
                </a>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    {hotel.location}
                  </h3>
                </div>
                <Dialog open={showMap} onOpenChange={setShowMap}>
                  <DialogTrigger asChild>
                    <button className="text-blue-500 hover:underline font-medium">See on Map</button>
                  </DialogTrigger>
                  <DialogContent className="bg-white max-w-2xl p-6 rounded-xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold">Location Map</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 rounded-lg overflow-hidden border bg-blue-50 flex flex-col items-center justify-center h-96 relative">
                      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50 flex items-center justify-center">
                        <div className="text-center p-4">
                          <MapPin className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
                          <h4 className="font-bold text-lg mt-2">{hotel.hotelName}</h4>
                          <p className="text-sm text-gray-500">{hotel.location}</p>
                          <p className="text-xs text-gray-400 mt-4">Simulated GPS Map View</p>
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur p-3 rounded-lg border flex items-center justify-between">
                        <span className="text-xs text-gray-600 font-medium">{hotel.location}</span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.hotelName} ${hotel.location}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
                        >
                          Open in Google Maps
                        </a>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={grandTotal}
        itemTitle={hotel?.hotelName || "Hotel Booking"}
        itemSubtitle={`${quantity} Room${quantity > 1 ? "s" : ""} • ${hotel?.location}`}
        onPaymentSuccess={handlebooking}
      />
    </div>
  );
};

export default BookHotelPage;
