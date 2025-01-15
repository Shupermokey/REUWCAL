import React from 'react';
import { useSubscription } from '../../context/SubscriptionProvider';

const FeatureX = () => {
    const { tier } = useSubscription();

    if (tier === 'free') {
        return <div>Feature X is available for Free and above</div>;
    } else if (tier === 'freetwo') {
        return <div>Feature X with premium settings for Free2 and above</div>;
    }
    else if (tier === 'market') {
        return <div>Feature X with premium settings for Market and above</div>;
    }
    else if (tier === 'developer') {
        return <div>Feature X with premium settings for developer and above</div>;
    }
    else if (tier === 'syndicator') {
        return <div>Feature X with premium settings for Syndicator </div>;
    }
     else {
        return <div>You need to upgrade to access Feature X</div>;
    }
};

export default FeatureX;
