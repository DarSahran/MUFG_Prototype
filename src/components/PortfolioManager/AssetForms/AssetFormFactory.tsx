import React from 'react';
import { StockForm } from './StockForm';
import { PropertyForm } from './PropertyForm';
import { CryptoForm } from './CryptoForm';
import { SuperForm } from './SuperForm';
import { BondForm } from './BondForm';
import { AssetSearchResult } from '../../../services/assetSearch';

interface AssetFormFactoryProps {
  assetType: string;
  selectedAsset?: AssetSearchResult;
  onSubmit: (assetData: any) => void;
  onCancel: () => void;
}

export const AssetFormFactory: React.FC<AssetFormFactoryProps> = ({
  assetType,
  selectedAsset,
  onSubmit,
  onCancel,
}) => {
  const getFormComponent = () => {
    switch (assetType) {
      case 'stock':
        return (
          <StockForm
            selectedAsset={selectedAsset}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        );
      case 'property':
        return (
          <PropertyForm
            selectedAsset={selectedAsset}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        );
      case 'crypto':
        return (
          <CryptoForm
            selectedAsset={selectedAsset}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        );
      case 'super':
        return (
          <SuperForm
            selectedAsset={selectedAsset}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        );
      case 'bond':
        return (
          <BondForm
            selectedAsset={selectedAsset}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        );
      default:
        return (
          <div className="p-6 text-center text-slate-500">
            <p>Asset type "{assetType}" not supported yet</p>
            <button
              onClick={onCancel}
              className="mt-4 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {getFormComponent()}
    </div>
  );
};

// Asset form configurations
export const ASSET_FORM_CONFIGS = {
  stock: {
    fields: ['symbol', 'quantity', 'purchasePrice', 'exchange', 'purchaseDate'],
    requiredFields: ['symbol', 'quantity', 'purchasePrice'],
    validation: {
      quantity: { min: 0.001, max: 1000000 },
      purchasePrice: { min: 0.01, max: 10000 },
    },
    component: StockForm,
  },
  property: {
    fields: ['address', 'marketValue', 'purchaseDate', 'propertyType', 'location'],
    requiredFields: ['address', 'marketValue', 'purchaseDate'],
    validation: {
      marketValue: { min: 1000, max: 50000000 },
    },
    component: PropertyForm,
  },
  crypto: {
    fields: ['symbol', 'quantity', 'purchasePrice', 'exchange', 'purchaseDate'],
    requiredFields: ['symbol', 'quantity', 'purchasePrice'],
    validation: {
      quantity: { min: 0.00000001, max: 1000000 },
      purchasePrice: { min: 0.000001, max: 1000000 },
    },
    component: CryptoForm,
  },
  super: {
    fields: ['fundName', 'balance', 'contributionRate', 'investmentOption'],
    requiredFields: ['fundName', 'balance'],
    validation: {
      balance: { min: 0, max: 10000000 },
      contributionRate: { min: 0, max: 100 },
    },
    component: SuperForm,
  },
  bond: {
    fields: ['issuer', 'faceValue', 'couponRate', 'maturityDate', 'purchasePrice'],
    requiredFields: ['issuer', 'faceValue', 'couponRate', 'maturityDate'],
    validation: {
      faceValue: { min: 100, max: 1000000 },
      couponRate: { min: 0, max: 20 },
    },
    component: BondForm,
  },
};