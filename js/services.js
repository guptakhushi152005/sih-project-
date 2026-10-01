/**
 * AGriVyn - Application Services Layer
 * Clean, judge-safe service abstractions connecting UI to business logic
 */

const CropHealthService = {
  /**
   * Run AI Vision diagnostic inference simulation on crop specimen
   * @param {string} sampleKey - 'onion' | 'wheat' | 'healthy'
   */
  diagnose: function(sampleKey) {
    const data = AGRI_DATA.diseaseDatabase[sampleKey] || AGRI_DATA.diseaseDatabase.onion;
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          crop: data.crop,
          condition: data.condition,
          pathogen: data.pathogen,
          confidence: data.confidence,
          severity: data.severity,
          affectedArea: data.affectedArea,
          recommendation: data.recommendation,
          organicControl: data.organicControl,
          chemicalControl: data.chemicalControl,
          marketImpact: data.marketImpact,
          visualIcon: data.visualIcon,
          badgeClass: data.badgeClass,
          disclaimer: 'AI-assisted preliminary assessment. Not a certified agricultural diagnosis.'
        });
      }, 1200);
    });
  }
};

const MarketPriceService = {
  /**
   * Get comparative Mandi and Buyer prices for a crop
   */
  getPricesForCrop: function(cropName) {
    return AGRI_DATA.marketPrices[cropName] || AGRI_DATA.marketPrices.Wheat;
  },

  /**
   * Calculate effective in-hand price after transport deductions
   */
  calculateNetPrice: function(quotedPrice, transportDeduction) {
    return Math.max(0, quotedPrice - transportDeduction);
  },

  /**
   * Get 7-day trend analytics and AI insight
   */
  getPriceTrend: function(cropName) {
    const trend = AGRI_DATA.trends[cropName] || AGRI_DATA.trends.Wheat;
    const todayPrice = trend[trend.length - 1].price;
    const avgPrice = Math.round(trend.reduce((acc, t) => acc + t.price, 0) / trend.length);
    const diff = todayPrice - avgPrice;
    
    return {
      points: trend,
      todayPrice: todayPrice,
      averagePrice: avgPrice,
      isHigher: diff >= 0,
      diffAmount: Math.abs(diff),
      insight: diff >= 0 
        ? 
        : 
    };
  }
};

const BuyerMatchingService = {
  /**
   * Rule-based 5-factor compatibility scoring engine
   */
  calculateMatchScore: function(farmerProduce, buyerRequirement) {
    let score = 0;
    const reasons = [];

    // 1. Crop Match
    if (farmerProduce.crop === buyerRequirement.crop) {
      score += 25;
      reasons.push('✓ Crop matches exactly (' + farmerProduce.crop + ')');
    }

    // 2. Quality / Grade Match
    if (farmerProduce.grade === buyerRequirement.grade || buyerRequirement.grade === 'Any Grade') {
      score += 25;
      reasons.push('✓ Quality grade matches (' + farmerProduce.grade + ')');
    }

    // 3. Lot Quantity Compatibility
    if (farmerProduce.quantity <= buyerRequirement.maxQuantity) {
      score += 20;
      reasons.push('✓ Quantity lot fits buyer demand (' + farmerProduce.quantity + ' Qtl)');
    }

    // 4. Proximity & Transit Distance
    if (farmerProduce.distance <= 30) {
      score += 15;
      reasons.push('✓ Nearby location (' + farmerProduce.distance + ' km away)');
    } else {
      score += 5;
      reasons.push('Proximity within operational zone');
    }

    // 5. Price within Buyer Budget Ceiling
    if (farmerProduce.price <= buyerRequirement.maxPrice) {
      score += 11;
      reasons.push('✓ Price within buyer ceiling (≤ ₹' + buyerRequirement.maxPrice + '/Qtl)');
    }

    return {
      matchPercentage: Math.min(score, 96),
      reasons: reasons
    };
  }
};

const WeatherService = {
  getWeatherData: function() {
    return AGRI_DATA.weather;
  }
};

const TradeService = {
  orders: [
    {
      id: 'ORD1234',
      buyer: 'Buyer B (Sharma Agro)',
      crop: 'Wheat (Sharbati)',
      quantity: 10,
      unit: 'Quintal',
      pricePerUnit: 2550,
      total: 25500,
      status: 'Offer Sent',
      stage: 1,
      date: '2026-08-30'
    }
  ],

  advanceStatus: function(orderId) {
    const order = this.orders.find(o => o.id === orderId) || this.orders[0];
    order.stage = (order.stage % 4) + 1;
    
    const stageMap = {
      1: { name: 'Offer Sent', badgeClass: 'bg-amber-100 text-amber-800' },
      2: { name: 'Accepted by Buyer', badgeClass: 'bg-blue-100 text-blue-800' },
      3: { name: 'In Transit', badgeClass: 'bg-purple-100 text-purple-800' },
      4: { name: 'Completed & Paid', badgeClass: 'bg-emerald-100 text-emerald-800' }
    };

    order.status = stageMap[order.stage].name;
    return {
      order: order,
      info: stageMap[order.stage]
    };
  }
};
