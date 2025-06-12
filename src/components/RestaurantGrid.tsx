// // components/RestaurantGrid.tsx

// import { useState, useEffect } from 'react';
// // types/restaurant.types.ts mein koi change nahi karna hai, isliye sirf Restaurant type import kiya hai
// import { Restaurant } from '../types/restaurant.types'; 
// import { RestaurantCard } from './RestaurantCard';
// import { fetchRestaurants } from '../apis/restaurant.api';

// interface Props {
//   selectedArea: string;
//   selectedCategory: string | null;
//   onRestaurantClick: (restaurant: Restaurant) => void;
// }

// // ✅ REMOVED: LocalDayHours aur LocalRestaurantHours ki ab zarurat nahi hai
// // kyuki hum hours object ke andar ki properties ko use nahi kar rahe hain.

// export const RestaurantGrid = ({ selectedArea, selectedCategory, onRestaurantClick }: Props) => {
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
  
//   // `allRestaurants` state ka type
//   const [allRestaurants, setAllRestaurants] = useState<(Restaurant & { isCurrentlyOpen: boolean })[]>([]);

//   // `filteredData` type
//   const [filteredData, setFilteredData] = useState<(Restaurant & { isCurrentlyOpen: boolean })[]>([]);

//   // ✅ SIMPLIFIED: Helper function to check if a restaurant is currently open
//   // Ab yeh function sirf top-level 'isOpen' property par rely karega.
//   const checkRestaurantIsOpen = (restaurant: Restaurant): boolean => {
//     // Only check the top-level 'isOpen' property
//     // If it's a boolean, return its value; otherwise, assume false.
//     if (typeof restaurant.isOpen === 'boolean') {
//       return restaurant.isOpen;
//     }
//     // Fallback if isOpen is not a boolean (e.g., undefined or null)
//     console.warn(`Restaurant "${restaurant.name}" has an invalid or missing top-level 'isOpen' property. Assuming closed.`);
//     return false;
//   };

//   // Fetches all restaurants and adds default values and `isCurrentlyOpen` status.
//   useEffect(() => {
//     const getRestaurants = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         // Assuming fetchRestaurants response structure is { success: boolean, message: string, data: Restaurant[] }
//         const response = await fetchRestaurants(); 
//         if (!response.success) {
//           throw new Error(response.message);
//         }
        
//         // Add default values for potentially missing properties and calculate isCurrentlyOpen
//         const restaurantsWithStatus = response.data.map(restaurant => ({
//           ...restaurant,
//           cuisines: restaurant.cuisines || 'No cuisines listed',
//           // Ensure address and area have default structures if missing
//           address: restaurant.address || { street: 'No address', city: '', state: '', pincode: '' },
//           area: restaurant.area || { id: '', pincode: 0, areaName: 'Unknown Area', cityName: '', stateName: '', latitude: 0, longitude: 0 },
//           // ✅ SIMPLIFIED: isCurrentlyOpen calculation now only uses the top-level isOpen
//           isCurrentlyOpen: checkRestaurantIsOpen(restaurant)
//         }));
//         setAllRestaurants(restaurantsWithStatus); // Store all restaurants with their calculated open status
//       } catch (err) {
//         console.error("Error in RestaurantGrid fetching restaurants:", err);
//         setError(err instanceof Error ? err.message : 'Failed to load restaurants');
//       } finally {
//         setLoading(false);
//       }
//     };

//     getRestaurants();
//   }, []); // Empty dependency array, runs only once on mount

//   // This useEffect now only handles filtering based on selectedArea and selectedCategory
//   useEffect(() => {
//     let currentFilteredRestaurants = [...allRestaurants]; 

//     // First, filter by selectedArea
//     if (selectedArea && selectedArea.toLowerCase() !== 'all') {
//       currentFilteredRestaurants = currentFilteredRestaurants.filter(restaurant => 
//         restaurant.area?.areaName.toLowerCase() === selectedArea.toLowerCase()
//       );
//     }

//     // Then, filter by selectedCategory on the already area-filtered list
//     if (selectedCategory) {
//       currentFilteredRestaurants = currentFilteredRestaurants.filter(restaurant => {
//         // Safely split cuisines, providing an empty array if cuisines is null/undefined
//         const cuisinesArray = restaurant.cuisines?.split(',').map(c => c.trim().toLowerCase()) || []; 
//         return cuisinesArray.includes(selectedCategory.toLowerCase());
//       });
//     }
    
//     setFilteredData(currentFilteredRestaurants);
//   }, [allRestaurants, selectedArea, selectedCategory]); // Dependencies include all three for re-filtering

//   // Filter filteredData into open and closed lists for rendering
//   const openRestaurants = filteredData.filter(restaurant => restaurant.isCurrentlyOpen);
//   const closedRestaurants = filteredData.filter(restaurant => !restaurant.isCurrentlyOpen);

//   if (loading) {
//     return (
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 pb-8">
//         {[1, 2, 3, 4].map((_, index) => (
//           <div key={index} className="aspect-[1.8/1] rounded-[25px] bg-white shimmer" />
//         ))}
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-center py-8">
//         <p className="text-red-500">{error}</p>
//       </div>
//     );
//   }

//   if (selectedArea === " ") {
//     return (
//       <div className="text-center py-8 text-gray-500">
//         Fetching restaurants in your area...
//       </div>
//     );
//   }

//   // Handle case where no restaurants (neither open nor closed) are found after all filters
//   if (openRestaurants.length === 0 && closedRestaurants.length === 0) {
//     return (
//       <div className="text-center py-8 text-gray-500">
//         No restaurants found {selectedCategory ? `for category "${selectedCategory}"` : ''} in {selectedArea}.
//       </div>
//     );
//   }

//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 pb-8">
//       {/* Open Restaurants Section */}
//       {openRestaurants.length > 0 && (
//         <>
//           {openRestaurants.map((restaurant) => (
//             <RestaurantCard
//               key={restaurant.id}
//               restaurant={restaurant}
//               isCurrentlyOpen={restaurant.isCurrentlyOpen}
//               onClick={() => onRestaurantClick(restaurant)}
//             />
//           ))}
//         </>
//       )}

//       {/* Separator if both open and closed restaurants exist */}
//       {openRestaurants.length > 0 && closedRestaurants.length > 0 && (
//         <div className="col-span-full mt-4 border-t border-gray-300 pt-4"></div>
//       )}

//       {/* Closed Restaurants Section */}
//       {closedRestaurants.length > 0 && (
//         <>
//           {closedRestaurants.map((restaurant) => (
//             <RestaurantCard
//               key={restaurant.id}
//               restaurant={restaurant}
//               isCurrentlyOpen={restaurant.isCurrentlyOpen}
//               onClick={() => onRestaurantClick(restaurant)}
//             />
//           ))}
//         </>
//       )}
//     </div>
//   );
// };




// // components/RestaurantGrid.tsx

// import { useState, useEffect } from 'react';
// import { Restaurant } from '../types/restaurant.types'; 
// import { RestaurantCard } from './RestaurantCard';
// import { fetchRestaurants } from '../apis/restaurant.api';

// interface Props {
//   selectedArea: string;
//   selectedCategory: string | null;
//   onRestaurantClick: (restaurant: Restaurant) => void;
//   searchText: string; // ✅ NEW: searchText prop
// }

// export const RestaurantGrid = ({ selectedArea, selectedCategory, onRestaurantClick, searchText }: Props) => { // ✅ UPDATED: Destructure searchText
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
  
//   const [allRestaurants, setAllRestaurants] = useState<(Restaurant & { isCurrentlyOpen: boolean })[]>([]);
//   const [filteredData, setFilteredData] = useState<(Restaurant & { isCurrentlyOpen: boolean })[]>([]);

//   const checkRestaurantIsOpen = (restaurant: Restaurant): boolean => {
//     if (typeof restaurant.isOpen === 'boolean') {
//       return restaurant.isOpen;
//     }
//     console.warn(`Restaurant "${restaurant.name}" has an invalid or missing top-level 'isOpen' property. Assuming closed.`);
//     return false;
//   };

//   useEffect(() => {
//     const getRestaurants = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         const response = await fetchRestaurants(); 
//         if (!response.success) {
//           throw new Error(response.message);
//         }
        
//         const restaurantsWithStatus = response.data.map(restaurant => ({
//           ...restaurant,
//           cuisines: restaurant.cuisines || 'No cuisines listed',
//           address: restaurant.address || { street: 'No address', city: '', state: '', pincode: '' },
//           area: restaurant.area || { id: '', pincode: 0, areaName: 'Unknown Area', cityName: '', stateName: '', latitude: 0, longitude: 0 },
//           isCurrentlyOpen: checkRestaurantIsOpen(restaurant)
//         }));
//         setAllRestaurants(restaurantsWithStatus);
//       } catch (err) {
//         console.error("Error in RestaurantGrid fetching restaurants:", err);
//         setError(err instanceof Error ? err.message : 'Failed to load restaurants');
//       } finally {
//         setLoading(false);
//       }
//     };

//     getRestaurants();
//   }, []);

//   // ✅ UPDATED: This useEffect now handles filtering including searchText
//   useEffect(() => {
//     let currentFilteredRestaurants = [...allRestaurants]; 
//     const lowerCaseSearchText = searchText.toLowerCase().trim(); // Search text ko lowercase aur trim karein

//     // First, filter by selectedArea
//     if (selectedArea && selectedArea.toLowerCase() !== 'all') {
//       currentFilteredRestaurants = currentFilteredRestaurants.filter(restaurant => 
//         restaurant.area?.areaName.toLowerCase() === selectedArea.toLowerCase()
//       );
//     }

//     // Then, filter by selectedCategory
//     if (selectedCategory) {
//       currentFilteredRestaurants = currentFilteredRestaurants.filter(restaurant => {
//         const cuisinesArray = restaurant.cuisines?.split(',').map(c => c.trim().toLowerCase()) || []; 
//         return cuisinesArray.includes(selectedCategory.toLowerCase());
//       });
//     }
    
//     // ✅ NEW: Filter by search text (restaurant name or cuisine)
//     if (lowerCaseSearchText) {
//       currentFilteredRestaurants = currentFilteredRestaurants.filter(restaurant => {
//         const restaurantNameMatches = restaurant.name.toLowerCase().includes(lowerCaseSearchText);
        
//         // Cuisines ko comma se split karke har ek cuisine ko check karein
//         const cuisineMatches = (restaurant.cuisines?.split(',') || [])
//           .map(c => c.trim().toLowerCase())
//           .some(cuisine => cuisine.includes(lowerCaseSearchText));

//         return restaurantNameMatches || cuisineMatches;
//       });
//     }

//     setFilteredData(currentFilteredRestaurants);
//   }, [allRestaurants, selectedArea, selectedCategory, searchText]); // ✅ UPDATED: Add searchText to dependency array

//   const openRestaurants = filteredData.filter(restaurant => restaurant.isCurrentlyOpen);
//   const closedRestaurants = filteredData.filter(restaurant => !restaurant.isCurrentlyOpen);

//   if (loading) {
//     return (
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 pb-8">
//         {[1, 2, 3, 4].map((_, index) => (
//           <div key={index} className="aspect-[1.8/1] rounded-[25px] bg-white shimmer" />
//         ))}
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-center py-8">
//         <p className="text-red-500">{error}</p>
//       </div>
//     );
//   }

//   if (selectedArea === " ") {
//     return (
//       <div className="text-center py-8 text-gray-500">
//         Fetching restaurants in your area...
//       </div>
//     );
//   }

//   if (openRestaurants.length === 0 && closedRestaurants.length === 0) {
//     return (
//       <div className="text-center py-8 text-gray-500">
//         No restaurants found {selectedCategory ? `for category "${selectedCategory}"` : ''} in {selectedArea} {searchText ? `for "${searchText}"` : ''}.
//       </div>
//     );
//   }

//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 pb-8">
//       {openRestaurants.length > 0 && (
//         <>
//           {openRestaurants.map((restaurant) => (
//             <RestaurantCard
//               key={restaurant.id}
//               restaurant={restaurant}
//               isCurrentlyOpen={restaurant.isCurrentlyOpen}
//               onClick={() => onRestaurantClick(restaurant)}
//             />
//           ))}
//         </>
//       )}

//       {openRestaurants.length > 0 && closedRestaurants.length > 0 && (
//         <div className="col-span-full mt-4 border-t border-gray-300 pt-4"></div>
//       )}

//       {closedRestaurants.length > 0 && (
//         <>
//           {closedRestaurants.map((restaurant) => (
//             <RestaurantCard
//               key={restaurant.id}
//               restaurant={restaurant}
//               isCurrentlyOpen={restaurant.isCurrentlyOpen}
//               onClick={() => onRestaurantClick(restaurant)}
//             />
//           ))}
//         </>
//       )}
//     </div>
//   );
// };



// components/RestaurantGrid.tsx

import { useState, useEffect } from 'react';
import { Restaurant } from '../types/restaurant.types'; 
import { RestaurantCard } from './RestaurantCard';
import { fetchRestaurants } from '../apis/restaurant.api';

interface Props {
  selectedArea: string;
  // This prop will now receive EITHER a top-level category OR a cuisine filter
  selectedCategory: string | null; 
  onRestaurantClick: (restaurant: Restaurant) => void;
  searchText: string;
}

export const RestaurantGrid = ({ selectedArea, selectedCategory, onRestaurantClick, searchText }: Props) => { 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [allRestaurants, setAllRestaurants] = useState<(Restaurant & { isCurrentlyOpen: boolean })[]>([]);
  const [filteredData, setFilteredData] = useState<(Restaurant & { isCurrentlyOpen: boolean })[]>([]);

  const checkRestaurantIsOpen = (restaurant: Restaurant): boolean => {
    if (typeof restaurant.isOpen === 'boolean') {
      return restaurant.isOpen;
    }
    console.warn(`Restaurant "${restaurant.name}" has an invalid or missing top-level 'isOpen' property. Assuming closed.`);
    return false;
  };

  useEffect(() => {
    const getRestaurants = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchRestaurants(); 
        if (!response.success) {
          throw new Error(response.message);
        }
        
        const restaurantsWithStatus = response.data.map(restaurant => ({
          ...restaurant,
          cuisines: restaurant.cuisines || 'No cuisines listed',
          address: restaurant.address || { street: 'No address', city: '', state: '', pincode: '' },
          area: restaurant.area || { id: '', pincode: 0, areaName: 'Unknown Area', cityName: '', stateName: '', latitude: 0, longitude: 0 },
          isCurrentlyOpen: checkRestaurantIsOpen(restaurant)
        }));
        setAllRestaurants(restaurantsWithStatus);
      } catch (err) {
        console.error("Error in RestaurantGrid fetching restaurants:", err);
        setError(err instanceof Error ? err.message : 'Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };

    getRestaurants();
  }, []);

  // This useEffect now handles filtering based on selectedArea, selectedCategory (which can be a cuisine filter), and searchText
  useEffect(() => {
    let currentFilteredRestaurants = [...allRestaurants]; 
    const lowerCaseSearchText = searchText.toLowerCase().trim(); 

    // First, filter by selectedArea
    if (selectedArea && selectedArea.toLowerCase() !== 'all') {
      currentFilteredRestaurants = currentFilteredRestaurants.filter(restaurant => 
        restaurant.area?.areaName.toLowerCase() === selectedArea.toLowerCase()
      );
    }

    // Then, filter by selectedCategory (this now handles cuisine filtering too)
    // Only apply category filter if selectedCategory is not null or empty
    if (selectedCategory) {
      currentFilteredRestaurants = currentFilteredRestaurants.filter(restaurant => {
        // Ensure cuisines is a string, then split and check for inclusion
        const cuisinesString = restaurant.cuisines || '';
        const cuisinesArray = cuisinesString.split(',').map(c => c.trim().toLowerCase());
        return cuisinesArray.includes(selectedCategory.toLowerCase());
      });
    }
    
    // Filter by search text (restaurant name or cuisine) - applies after area and category filters
    if (lowerCaseSearchText) {
      currentFilteredRestaurants = currentFilteredRestaurants.filter(restaurant => {
        const restaurantNameMatches = restaurant.name.toLowerCase().includes(lowerCaseSearchText);
        
        const cuisineMatches = (restaurant.cuisines?.split(',') || [])
          .map(c => c.trim().toLowerCase())
          .some(cuisine => cuisine.includes(lowerCaseSearchText));

        return restaurantNameMatches || cuisineMatches;
      });
    }

    setFilteredData(currentFilteredRestaurants);
  }, [allRestaurants, selectedArea, selectedCategory, searchText]); // Dependency array updated

  const openRestaurants = filteredData.filter(restaurant => restaurant.isCurrentlyOpen);
  const closedRestaurants = filteredData.filter(restaurant => !restaurant.isCurrentlyOpen);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 pb-8">
        {[1, 2, 3, 4].map((_, index) => (
          <div key={index} className="aspect-[1.8/1] rounded-[25px] bg-white shimmer" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (selectedArea === " ") {
    return (
      <div className="text-center py-8 text-gray-500">
        Fetching restaurants in your area...
      </div>
    );
  }

  if (openRestaurants.length === 0 && closedRestaurants.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No restaurants found {selectedCategory ? `for category "${selectedCategory}"` : ''} in {selectedArea} {searchText ? `for "${searchText}"` : ''}.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 pb-8">
      {openRestaurants.length > 0 && (
        <>
          {openRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              isCurrentlyOpen={restaurant.isCurrentlyOpen}
              onClick={() => onRestaurantClick(restaurant)}
            />
          ))}
        </>
      )}

      {openRestaurants.length > 0 && closedRestaurants.length > 0 && (
        <div className="col-span-full mt-4 border-t border-gray-300 pt-4"></div>
      )}

      {closedRestaurants.length > 0 && (
        <>
          {closedRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              isCurrentlyOpen={restaurant.isCurrentlyOpen}
              onClick={() => onRestaurantClick(restaurant)}
            />
          ))}
        </>
      )}
    </div>
  );
};