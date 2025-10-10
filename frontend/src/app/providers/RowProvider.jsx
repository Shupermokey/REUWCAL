// import React, { createContext, useContext, useState } from "react";

// // Create a context for the game state
// const RowContext = createContext();

// // Provider component to provide game state to its children
// export const RowProvider = ({ children }) => {
//   const [propertyAddress, setPropertyAddress] = useState('');
//   const [propertyAddressSF, setPropertyAddressSF] = useState('');
//   const [purchasePriceSF, setPurchasePriceSF] = useState('');
//   const [purchasePrice, setPurchasePrice] = useState('');
//   const [ACQCAPXSF, setACQCAPXSF] = useState('');
//   const [ACQCAPX, setACQCAPX] = useState('');
//   const [unitCount, setUnitCount] = useState('');
//   const [grossBuildingArea, setGrossBuildingArea] = useState('');
//   const [grossSiteArea, setGrossSiteArea] = useState('');
//   const [rePropertyTax, setRePropertyTax] = useState('');
//   const [marketRate, setMarketRate] = useState('');
//   const [serviceStructure, setServiceStructure] = useState('');
//   const [propertyClass, setPropertyClass] = useState('');


//   return (
//     <RowContext.Provider
//       value={{
//         propertyAddress,
//         setPropertyAddress,
//         propertyAddressSF,
//         setPropertyAddressSF,
//         purchasePriceSF,
//         setPurchasePriceSF,
//         purchasePrice,
//         setPurchasePrice,
//         ACQCAPXSF,
//         setACQCAPXSF,
//         ACQCAPX,
//         setACQCAPX,
//         unitCount,
//         setUnitCount,
//         grossBuildingArea,
//         setGrossBuildingArea,
//         grossSiteArea,
//         setGrossSiteArea,
//         rePropertyTax,
//         setRePropertyTax,
//         marketRate,
//         setMarketRate,
//         serviceStructure,
//         setServiceStructure,
//         propertyClass,
//         setPropertyClass
//       }}
//     >
//       {children}
//     </RowContext.Provider>
//   );
// };

// export const useRow = () => useContext(RowContext);