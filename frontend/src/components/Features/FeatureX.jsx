import React from 'react';
import { useAuth } from '../../context/AuthProvider';

const FeatureX = () => {
    const { subscription } = useAuth();



    const featureText = {
        free: "Feature X is available for Free and above",
        freetwo: "Feature X with premium settings for Free2 and above",
        price_1Qsv8DEgiGJZMTseaDY7IXHY: "Feature X with premium settings for Market and above",
        developer: "Feature X with premium settings for Developer and above",
        syndicator: "Feature X with premium settings for Syndicator",
    };

    return (
        <div>
            {featureText[subscription] || "You need to upgrade to access Feature X"}
        </div>
    );
};

export default FeatureX;
