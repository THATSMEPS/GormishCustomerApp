// // components/LocationPopup.tsx

// import { useState, useRef, useEffect, useCallback } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { ChevronDown } from 'lucide-react';
// import { Customer, Area, StructuredCustomerAddress, UpdateCustomerAddressPayload } from "../types/customer.types"; 
// import { updateCustomerAddress } from '../apis/customer.api';
// import MapLocationPicker from './MapLocationPicker'; // MapLocationPicker import kiya

// interface Props {
//   isOpen: boolean;
//   onClose: () => void;
//   // Parent component ko selected area name pass karne ke liye
//   onAreaSelect: (areaName: string) => void;
//   // Ab yeh props initial data receive karne ke liye use nahi honge,
//   // balki component khud localStorage se lega. Par type definition rakhi hai
//   // agar parent se phir bhi koi fallback aaye.
//   initialCustomerData: Customer | null; 
//   initialAvailableAreas: Area[];
//   // NEW PROP: Area selection ko disable karne ke liye
//   disableAreaSelection?: boolean;
// }

// export const LocationPopup = ({ 
//   isOpen, 
//   onClose, 
//   onAreaSelect, 
//   // initialCustomerData, // Ab yeh props directly state ko initialize nahi karenge
//   // initialAvailableAreas,
//   disableAreaSelection = false 
// }: Props) => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const [address, setAddress] = useState(''); // User dwara typed address
//   // ✅ UPDATED: customerData aur availableAreas ko directly localStorage se initialize kiya gaya hai
//   const [customerData, setCustomerData] = useState<Customer | null>(() => {
//     const storedCustomer = localStorage.getItem('customerData');
//     return storedCustomer ? JSON.parse(storedCustomer) : null;
//   });
//   const [availableAreas, setAvailableAreas] = useState<Area[]>(() => {
//     const storedAreas = localStorage.getItem('availableAreas');
//     return storedAreas ? JSON.parse(storedAreas) : [];
//   });
  
//   const popupRef = useRef<HTMLDivElement>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const [selectedMapLocation, setSelectedMapLocation] = useState<{
//     lat: number;
//     lng: number;
//     address: string; // Map se mila hua address string
//   } | null>(null);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (isSubmitting) return; 
//       if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
//         const mapElement = document.querySelector('.leaflet-container');
//         if (mapElement && mapElement.contains(event.target as Node)) {
//             return;
//         }
//         onClose();
//       }
//     };

//     if (isOpen) {
//       document.addEventListener('mousedown', handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [isOpen, onClose, isSubmitting]);

//   // ✅ UPDATED useEffect: Component open hone par localStorage se data load karein aur states ko initialize karein
//   useEffect(() => {
//     if (isOpen) {
//       // localStorage se latest data fetch karein
//       const storedCustomer = localStorage.getItem('customerData');
//       const storedAreas = localStorage.getItem('availableAreas');
      
//       const currentCustomerData: Customer | null = storedCustomer ? JSON.parse(storedCustomer) : null;
//       const currentAvailableAreas: Area[] = storedAreas ? JSON.parse(storedAreas) : [];

//       setCustomerData(currentCustomerData);
//       setAvailableAreas(currentAvailableAreas); // Ensure availableAreas state is up-to-date

//       if (currentCustomerData) {
//         // Address input field ko initialize karein
//         if (typeof currentCustomerData.address === 'object' && currentCustomerData.address !== null) {
//             const structuredAddr = currentCustomerData.address as StructuredCustomerAddress;
//             setAddress(structuredAddr.typedAddress || '');
            
//             // Map location ko initialize karein
//             setSelectedMapLocation({
//                 lat: structuredAddr.latitude || 23.237560,
//                 lng: structuredAddr.longitude || 72.647781,
//                 address: structuredAddr.mappedAddress || structuredAddr.typedAddress || ''
//             });
            
//             // ✅ IMPORTANT: searchQuery (area name) ko structured address ke areaId se set karein
//             const initialArea = currentAvailableAreas.find(area => area.id === structuredAddr.areaId);
//             if (initialArea) {
//                 setSearchQuery(initialArea.areaName);
//             } else {
//                 // Fallback agar areaId availableAreas mein match na kare
//                 setSearchQuery(currentCustomerData.area?.areaName || 'Navrangpura');
//             }

//         } else {
//             // Backward compatibility for old string address format
//             setAddress(currentCustomerData.address as string || '');
//             if (currentCustomerData.area?.latitude && currentCustomerData.area?.longitude) {
//                 setSelectedMapLocation({
//                     lat: currentCustomerData.area.latitude,
//                     lng: currentCustomerData.area.longitude,
//                     address: currentCustomerData.address as string || ''
//                 });
//             } else {
//                 setSelectedMapLocation(null);
//             }
//             // Old way of setting searchQuery from root areaId
//             const matchedArea = currentAvailableAreas.find(area => area.id === currentCustomerData.areaId);
//             if (matchedArea) {
//               setSearchQuery(matchedArea.areaName);
//             } else {
//               setSearchQuery('Navrangpura');
//             }
//         }
//       } else {
//         // Agar customerData localStorage mein nahi hai
//         setAddress('');
//         setSearchQuery('');
//         setSelectedMapLocation(null); 
//       }
//     }
//   }, [isOpen]); // Dependencies mein ab initialCustomerData aur initialAvailableAreas nahi hai

//   const filteredAreas = (isDropdownOpen && !searchQuery)
//     ? availableAreas
//     : availableAreas.filter(area =>
//         area.areaName.toLowerCase().includes(searchQuery.toLowerCase())
//       );

//   const handleMapLocationSelect = useCallback((lat: number, lng: number, addr: string) => {
//     setSelectedMapLocation({ lat, lng, address: addr });
//   }, []);

//   const isFormValid = () => {
//     const isAddressFilled = address.trim() !== '';
//     const isValidAreaSelected = availableAreas.some(area => 
//       area.areaName.toLowerCase() === searchQuery.toLowerCase()
//     );
//     const isMapLocationSelected = selectedMapLocation !== null;

//     return isAddressFilled && isValidAreaSelected && isMapLocationSelected && !isSubmitting;
//   };

//   const handleSubmit = async () => {
//     if (isSubmitting || !customerData || !isFormValid()) {
//       console.error("Submission in progress, customer data not loaded, or form is invalid.");
//       return;
//     }

//     setIsSubmitting(true);
    
//     let areaIdToUpdate: string = customerData.areaId;
//     let areaNameToPass: string = customerData.area?.areaName || 'Unknown Area';

//     // DisableAreaSelection ka logic yahan nahi badlega, kyuki woh prop se control ho raha hai
//     // Aur yahan selectedAreaObject ko local state `availableAreas` se find kiya ja raha hai
//     const selectedAreaObject = availableAreas.find(area => area.areaName.toLowerCase() === searchQuery.toLowerCase());

//     if (!selectedAreaObject) {
//         console.warn("Selected area not found in availableAreas. Cannot update areaId. Closing popup.");
//         setIsSubmitting(false);
//         onClose(); 
//         return;
//     }
//     areaIdToUpdate = selectedAreaObject.id;
//     areaNameToPass = selectedAreaObject.areaName;
    

//     const addressPayload: StructuredCustomerAddress = {
//         typedAddress: address,
//         latitude: selectedMapLocation?.lat || 0,
//         longitude: selectedMapLocation?.lng || 0,
//         mappedAddress: selectedMapLocation?.address || 'Address not mapped',
//         areaId: areaIdToUpdate, // areaId ab address object ke andar hai
//     };

//     try {
//       const customerId = customerData.id;
//       // ✅ UPDATED PAYLOAD: areaId ab root level par bhi hai
//       const payload: UpdateCustomerAddressPayload = {
//         address: addressPayload, // Structured address object
//         areaId: areaIdToUpdate, // ✅ areaId at root level
//       };

//       console.log("Update Customer Address Payload:", payload);

//       const updateResponse = await updateCustomerAddress(customerId, payload);

//       if (updateResponse.success && updateResponse.data) {
//         console.log("Customer address and area updated successfully:", updateResponse.data);
        
//         // Update customerData state with the full updated customer object
//         setCustomerData(updateResponse.data);
        
//         // Update localStorage with the full updated customer object
//         localStorage.setItem('customerData', JSON.stringify(updateResponse.data));

//         // Update localStorage.selectedArea with the new areaName
//         const updatedAreaName = updateResponse.data.area?.areaName || areaNameToPass;
//         localStorage.setItem('selectedArea', updatedAreaName);

//         onAreaSelect(updatedAreaName); 
//       } else {
//         console.error("Failed to update customer address and area:", updateResponse.message);
//         onAreaSelect(areaNameToPass);
//       }
//     } catch (error) {
//       console.error("Error during customer update:", error);
//       onAreaSelect(areaNameToPass);
//     } finally {
//       setIsSubmitting(false);
//       onClose();
//     }
//   };

//   return (
//     <AnimatePresence>
//       {isOpen && (
//         <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[2px]">
//           <motion.div
//             ref={popupRef}
//             initial={{ y: -20, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             exit={{ y: -20, opacity: 0 }}
//             transition={{ duration: 0.2 }}
//             className={`absolute top-0 left-0 right-0 p-4 ${isSubmitting ? 'pointer-events-none' : ''}`}
//           >
//             <div
//               className="rounded-[25px] p-6 max-w-xl mx-auto shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/20"
//               style={{
//                 background: 'rgba(242, 242, 245, 0.95)',
//                 backdropFilter: 'blur(20px)',
//                 WebkitBackdropFilter: 'blur(20px)',
//               }}
//             >
//               <div className="space-y-4">
//                 {/* Location Header */}
//                 <div
//                   className="rounded-[15px] p-4 flex flex-col justify-between items-start"
//                   style={{
//                     background: 'rgba(255, 255, 255, 1)',
//                     backdropFilter: 'blur(12px)',
//                     WebkitBackdropFilter: 'blur(12px)',
//                   }}
//                 >
//                   <span className="font-semibold">Location</span>
//                   <span className="text-gray-500 font-light truncate max-w-[100%]">
//                     {/* Display current customer's combined address, now handling string or object */}
//                     {customerData?.address
//                         ? (typeof customerData.address === 'string' 
//                             ? `${customerData.address} | ${customerData.area?.areaName || 'Unknown Area'}`
//                             : `${customerData.address.typedAddress || 'N/A'} | ${customerData.area?.areaName || 'Unknown Area'}`
//                           )
//                         : 'Loading Location...'
//                     }
//                   </span>
//                 </div>

//                 {/* Address Input */}
//                 <div
//                   className="rounded-[15px] p-4"
//                   style={{
//                     background: 'rgba(255, 255, 255, 1)',
//                     backdropFilter: 'blur(12px)',
//                     WebkitBackdropFilter: 'blur(12px)',
//                   }}
//                 >
//                   <input
//                     type="text"
//                     placeholder="Enter/Change Address (Street, Building, etc.)"
//                     value={address}
//                     onChange={(e) => setAddress(e.target.value)}
//                     className="w-full font-light focus:outline-none bg-transparent"
//                     disabled={isSubmitting}
//                   />
//                 </div>

//                 {/* Area Selector */}
//                 <div className="relative">
//                   <div
//                     className={`rounded-[15px] p-4 flex justify-between items-center ${disableAreaSelection ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
//                     style={{
//                       background: 'rgba(255, 255, 255, 0.85)',
//                       backdropFilter: 'blur(12px)',
//                       WebkitBackdropFilter: 'blur(12px)',
//                     }}
//                     onClick={() => !disableAreaSelection && setIsDropdownOpen(!isDropdownOpen)}
//                   >
//                     <input
//                       type="text"
//                       placeholder="Choose Area"
//                       value={searchQuery}
//                       onChange={(e) => {
//                         if (!disableAreaSelection) {
//                           setSearchQuery(e.target.value);
//                           setIsDropdownOpen(true);
//                         }
//                       }}
//                       className={`w-full font-light focus:outline-none bg-transparent ${disableAreaSelection ? 'cursor-not-allowed opacity-60' : ''}`}
//                       onClick={(e) => e.stopPropagation()}
//                       disabled={isSubmitting || disableAreaSelection}
//                     />
//                     {!disableAreaSelection && (
//                       <ChevronDown
//                         className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
//                       />
//                     )}
//                   </div>

//                   {/* Dropdown Options */}
//                   <AnimatePresence>
//                     {isDropdownOpen && !disableAreaSelection && (
//                       <motion.div
//                         initial={{ opacity: 0, y: -10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         exit={{ opacity: 0, y: -10 }}
//                         className="absolute top-full left-0 right-0 mt-2 rounded-[15px] shadow-lg max-h-[300px] overflow-y-auto z-[2000]"
//                         style={{
//                           background: 'rgba(255, 255, 255, 1)',
//                           backdropFilter: 'blur(12px)',
//                           WebkitBackdropFilter: 'blur(12px)',
//                         }}
//                       >
//                         {filteredAreas.map((area) => (
//                           <div
//                             key={area.id}
//                             className="p-3 hover:bg-white/50 cursor-pointer font-light transition-colors"
//                             onClick={() => {
//                               if (!isSubmitting && !disableAreaSelection) {
//                                 setSearchQuery(area.areaName);
//                                 setIsDropdownOpen(false);
//                               }
//                             }}
//                           >
//                             {area.areaName}
//                           </div>
//                         ))}
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </div>

//                 {/* Map locations embedding */}
//                 <div className="mt-4">
//                   <MapLocationPicker
//                     initialLat={selectedMapLocation?.lat || 23.237560} 
//                     initialLng={selectedMapLocation?.lng || 72.647781}
//                     initialZoom={13}
//                     onLocationSelect={handleMapLocationSelect}
//                   />
//                 </div>

//                 {/* Submit Button */}
//                 <button
//                   className={`w-full text-white rounded-full py-3 font-semibold transition-colors ${
//                     isFormValid() ? 'bg-[#6552FF] hover:bg-opacity-90' : 'bg-gray-400 cursor-not-allowed'
//                   }`}
//                   onClick={handleSubmit}
//                   disabled={!isFormValid()}
//                 >
//                   {isSubmitting ? 'Updating Location...' : 'Update Location'}
//                 </button>
//               </div>
//             </div>
//           </motion.div>
//         </div>
//       )}
//     </AnimatePresence>
//   );
// };



// components/LocationPopup.tsx

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Customer, Area, StructuredCustomerAddress, UpdateCustomerAddressPayload } from "../types/customer.types"; 
import { updateCustomerAddress } from '../apis/customer.api';
import MapLocationPicker from './MapLocationPicker'; // MapLocationPicker import kiya

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // Parent component ko selected area name pass karne ke liye
  onAreaSelect: (areaName: string) => void;
  // Ab yeh props initial data receive karne ke liye use nahi honge,
  // balki component khud localStorage se lega. Par type definition rakhi hai
  // agar parent se phir bhi koi fallback aaye.
  initialCustomerData: Customer | null; 
  initialAvailableAreas: Area[];
  // NEW PROP: Area selection ko disable karne ke liye
  disableAreaSelection?: boolean;
}

export const LocationPopup = ({ 
  isOpen, 
  onClose, 
  onAreaSelect, 
  disableAreaSelection = false 
}: Props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [address, setAddress] = useState(''); // User dwara typed address
  // ✅ UPDATED: customerData aur availableAreas ko directly localStorage se initialize kiya gaya hai
  const [customerData, setCustomerData] = useState<Customer | null>(() => {
    const storedCustomer = localStorage.getItem('customerData');
    return storedCustomer ? JSON.parse(storedCustomer) : null;
  });
  const [availableAreas, setAvailableAreas] = useState<Area[]>(() => {
    const storedAreas = localStorage.getItem('availableAreas');
    return storedAreas ? JSON.parse(storedAreas) : [];
  });
  
  const popupRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedMapLocation, setSelectedMapLocation] = useState<{
    lat: number;
    lng: number;
    address: string; // Map se mila hua address string
  } | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSubmitting) return; 
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        const mapElement = document.querySelector('.leaflet-container');
        if (mapElement && mapElement.contains(event.target as Node)) {
            return;
        }
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, isSubmitting]);

  // ✅ UPDATED useEffect: Component open hone par localStorage se data load karein aur states ko initialize karein
  // Default values set nahi honge agar data null/empty hai
  useEffect(() => {
    if (isOpen) {
      // localStorage se latest data fetch karein
      const storedCustomer = localStorage.getItem('customerData');
      const storedAreas = localStorage.getItem('availableAreas');
      
      const currentCustomerData: Customer | null = storedCustomer ? JSON.parse(storedCustomer) : null;
      const currentAvailableAreas: Area[] = storedAreas ? JSON.parse(storedAreas) : [];

      setCustomerData(currentCustomerData);
      setAvailableAreas(currentAvailableAreas); // Ensure availableAreas state is up-to-date

      let initialAddress = '';
      let initialMapLocation: { lat: number; lng: number; address: string; } | null = null;
      let initialSearchQuery = ''; // This will hold the area name

      if (currentCustomerData) {
          // Check for typedAddress safely
          if (typeof currentCustomerData.address === 'object' && currentCustomerData.address !== null) {
            const structuredAddr = currentCustomerData.address as StructuredCustomerAddress;
            // ✅ FIX: Check if typedAddress is a string before assigning
            if (typeof structuredAddr.typedAddress === 'string') {
                initialAddress = structuredAddr.typedAddress;
            }
          } else if (typeof currentCustomerData.address === 'string') { // Backward compatibility for old string address
              initialAddress = currentCustomerData.address;
          }
          
          // Check for map coordinates and mapped address safely
          if (typeof currentCustomerData.address === 'object' && currentCustomerData.address !== null && 
              typeof currentCustomerData.address.latitude === 'number' && typeof currentCustomerData.address.longitude === 'number') {
              initialMapLocation = {
                  lat: currentCustomerData.address.latitude,
                  lng: currentCustomerData.address.longitude,
                  // ✅ FIX: Check if mappedAddress is a string before assigning
                  address: (typeof currentCustomerData.address.mappedAddress === 'string' && currentCustomerData.address.mappedAddress.trim() !== '') ? currentCustomerData.address.mappedAddress : initialAddress
              };
          } else if (currentCustomerData.area?.latitude && currentCustomerData.area?.longitude && initialAddress) {
              // Fallback for old area lat/lng if address is string, but only if an address is present
              initialMapLocation = {
                  lat: currentCustomerData.area.latitude,
                  lng: currentCustomerData.area.longitude,
                  address: initialAddress // Use initialAddress as mapped address fallback
              };
          }

          // Check for areaId and find areaName safely
          // ✅ FIX: Check if areaId is a string before assigning
          if (typeof currentCustomerData.areaId === 'string' && currentCustomerData.areaId.trim() !== '') {
              const matchedArea = currentAvailableAreas.find(area => area.id === currentCustomerData.areaId);
              if (matchedArea) {
                  initialSearchQuery = matchedArea.areaName;
              }
          }
      }
      
      // Set states - if checks above didn't find data, they remain empty/null
      setAddress(initialAddress);
      setSearchQuery(initialSearchQuery);
      setSelectedMapLocation(initialMapLocation);

    }
  }, [isOpen]); // Dependencies mein ab initialCustomerData aur initialAvailableAreas nahi hai

  const filteredAreas = (isDropdownOpen && !searchQuery)
    ? availableAreas
    : availableAreas.filter(area =>
        area.areaName.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleMapLocationSelect = useCallback((lat: number, lng: number, addr: string) => {
    setSelectedMapLocation({ lat, lng, address: addr });
  }, []);

  const isFormValid = () => {
    // ✅ FIX: Ensure all three fields are filled with non-empty string data
    // This directly addresses the user's requirement.
    const isAddressInputFilled = typeof address === 'string' && address.trim() !== '';
    
    const isAreaSelectedAndValid = typeof searchQuery === 'string' && searchQuery.trim() !== '' &&
                                 availableAreas.some(area => 
                                   // ✅ FIX: Ensure area.areaName is string before using toLowerCase
                                   typeof area.areaName === 'string' && area.areaName.toLowerCase() === searchQuery.toLowerCase()
                                 );
                                 
    const isMapLocationDefinitelySelected = selectedMapLocation !== null && 
                                            typeof selectedMapLocation.address === 'string' && 
                                            selectedMapLocation.address.trim() !== '' &&
                                            typeof selectedMapLocation.lat === 'number' && !isNaN(selectedMapLocation.lat) &&
                                            typeof selectedMapLocation.lng === 'number' && !isNaN(selectedMapLocation.lng);

    return isAddressInputFilled && isAreaSelectedAndValid && isMapLocationDefinitelySelected && !isSubmitting;
  };

  const handleSubmit = async () => {
    if (isSubmitting || !customerData || !isFormValid()) {
      console.error("Submission in progress, customer data not loaded, or form is invalid.");
      return;
    }

    setIsSubmitting(true);
    
    let areaIdToUpdate: string = customerData.areaId; // Default to current customer's areaId
    let areaNameToPass: string = customerData.area?.areaName || 'Unknown Area';

    // Dropdown se chune hue areaId ko use karein agar selection enabled hai
    if (!disableAreaSelection) {
        const selectedAreaObject = availableAreas.find(area => typeof searchQuery === 'string' && area.areaName.toLowerCase() === searchQuery.toLowerCase());

        if (!selectedAreaObject) {
            console.warn("Selected area not found in available areas. Cannot update areaId. Closing popup.");
            setIsSubmitting(false);
            onClose(); 
            return;
        }
        areaIdToUpdate = selectedAreaObject.id;
        areaNameToPass = selectedAreaObject.areaName;
    }

    // ✅ UPDATED PAYLOAD STRUCTURE FOR ADDRESS OBJECT
    const addressPayload = {
        typedAddress: address, // User ne input field mein jo type kiya hai
        latitude: selectedMapLocation?.lat || 0, // Map se chuni hui latitude
        longitude: selectedMapLocation?.lng || 0, // Map se chuni hui longitude
        mappedAddress: selectedMapLocation?.address || 'Address not mapped', // Map se mila hua address string
        areaId: areaIdToUpdate, // ✅ areaId ab address object ke andar hai
    };

    try {
      const customerId = customerData.id;
      // ✅ FIX: Payload mein 'areaId' ko root level par bhi add kiya gaya hai
      // Yeh tumhari `customer.types.ts` file mein defined `UpdateCustomerAddressPayload` type ko match karega.
      const payload: UpdateCustomerAddressPayload = {
        address: addressPayload, // ✅ Ab yeh naya structured address object hai
        areaId: areaIdToUpdate, // ✅ FIX: areaId ko root level par bhi add kiya gaya hai
      };

      console.log("Update Customer Address Payload:", payload); // Debugging ke liye

      const updateResponse = await updateCustomerAddress(customerId, payload);

      if (updateResponse.success && updateResponse.data) {
        console.log("Customer address and area updated successfully:", updateResponse.data);
        // onAreaSelect ko ab areaName address object se milega
        // Kyunki customerData.address ab object hai, updateResponse.data.address.area.areaName
        // ya phir agar area property directly root par hai, toh updateResponse.data.area.areaName
        // Yahan assumption hai ki updateResponse.data mein `area` object root par hoga
        onAreaSelect(updateResponse.data.area?.areaName || areaNameToPass); 
      } else {
        console.error("Failed to update customer address and area:", updateResponse.message);
        onAreaSelect(areaNameToPass);
      }
    } catch (error) {
      console.error("Error during customer update:", error);
      onAreaSelect(areaNameToPass);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[2px]">
          <motion.div
            ref={popupRef}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-0 left-0 right-0 p-4 ${isSubmitting ? 'pointer-events-none' : ''}`}
          >
            <div
              className="rounded-[25px] p-6 max-w-xl mx-auto shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/20"
              style={{
                background: 'rgba(242, 242, 245, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <div className="space-y-4">
                {/* Location Header */}
                <div
                  className="rounded-[15px] p-4 flex flex-col justify-between items-start"
                  style={{
                    background: 'rgba(255, 255, 255, 1)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  <span className="font-semibold">Location</span>
                  <span className="text-gray-500 font-light truncate max-w-[100%]">
                    {/* Display current customer's combined address. Ab address object ho sakta hai. */}
                    {customerData?.address
                        ? (typeof customerData.address === 'string' 
                            ? `${customerData.address} | ${customerData.area?.areaName || 'Unknown Area'}`
                            : `${(customerData.address as StructuredCustomerAddress)?.typedAddress || 'N/A'} | ${customerData.area?.areaName || 'Unknown Area'}`
                          )
                        : 'Loading Location...'
                    }
                  </span>
                </div>

                {/* Address Input */}
                <div
                  className="rounded-[15px] p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 1)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Enter/Change Address (Street, Building, etc.)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full font-light focus:outline-none bg-transparent"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Area Selector */}
                <div className="relative">
                  <div
                    className={`rounded-[15px] p-4 flex justify-between items-center ${disableAreaSelection ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    style={{
                      background: 'rgba(255, 255, 255, 0.85)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                    }}
                    onClick={() => !disableAreaSelection && setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <input
                      type="text"
                      placeholder="Choose Area"
                      value={searchQuery}
                      onChange={(e) => {
                        if (!disableAreaSelection) {
                          setSearchQuery(e.target.value);
                          setIsDropdownOpen(true);
                        }
                      }}
                      className={`w-full font-light focus:outline-none bg-transparent ${disableAreaSelection ? 'cursor-not-allowed opacity-60' : ''}`}
                      onClick={(e) => e.stopPropagation()}
                      disabled={isSubmitting || disableAreaSelection}
                    />
                    {!disableAreaSelection && (
                      <ChevronDown
                        className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    )}
                  </div>

                  {/* Dropdown Options */}
                  <AnimatePresence>
                    {isDropdownOpen && !disableAreaSelection && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 rounded-[15px] shadow-lg max-h-[300px] overflow-y-auto z-[2000]"
                        style={{
                          background: 'rgba(255, 255, 255, 1)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                        }}
                      >
                        {filteredAreas.map((area) => (
                          <div
                            key={area.id}
                            className="p-3 hover:bg-white/50 cursor-pointer font-light transition-colors"
                            onClick={() => {
                              if (!isSubmitting && !disableAreaSelection) {
                                setSearchQuery(area.areaName);
                                setIsDropdownOpen(false);
                              }
                            }}
                          >
                            {area.areaName}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Map locations embedding */}
                <div className="mt-4">
                  <MapLocationPicker
                    initialLat={selectedMapLocation?.lat || 23.237560} 
                    initialLng={selectedMapLocation?.lng || 72.647781}
                    initialZoom={13}
                    onLocationSelect={handleMapLocationSelect}
                  />
                </div>

                {/* Submit Button */}
                <button
                  className={`w-full text-white rounded-full py-3 font-semibold transition-colors ${
                    isFormValid() ? 'bg-[#6552FF] hover:bg-opacity-90' : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  onClick={handleSubmit}
                  disabled={!isFormValid()}
                >
                  {isSubmitting ? 'Updating Location...' : 'Update Location'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
