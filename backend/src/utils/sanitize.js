/**
 * Utility to sanitize auction state for the public live display.
 * Viewers must NOT see:
 * - Admin controls or private data
 * - Team remaining balances or private budgets
 * - Unrelated internal state
 * 
 * Viewers CAN see:
 * - Current player (photo, name, serialNumber, age, category, battingStyle, bowlingStyle, basePrice, description)
 * - Current highest bid
 * - Current bidding team name & logo
 * - Auction status (IDLE, ACTIVE, PAUSED, SOLD, UNSOLD)
 * - Winning team info when SOLD
 * - Current round
 */
const sanitizeForPublic = (state) => {
  if (!state) return null;

  const publicData = {
    status: state.status,
    currentRound: state.currentRound,
    isUnsoldRound: state.isUnsoldRound,
    currentBid: state.currentBid || 0,
    currentIncrement: state.currentIncrement,
    updatedAt: state.updatedAt
  };

  if (state.currentPlayer) {
    publicData.currentPlayer = {
      _id: state.currentPlayer._id,
      serialNumber: state.currentPlayer.serialNumber,
      name: state.currentPlayer.name,
      photo: state.currentPlayer.photo,
      age: state.currentPlayer.age,
      category: state.currentPlayer.category?.name || (state.currentPlayer.category ? state.currentPlayer.category.toString() : 'General'),
      battingStyle: state.currentPlayer.battingStyle,
      bowlingStyle: state.currentPlayer.bowlingStyle,
      previousTeam: state.currentPlayer.previousTeam,
      basePrice: state.currentPlayer.basePrice,
      description: state.currentPlayer.description,
      status: state.currentPlayer.status,
      soldPrice: state.currentPlayer.soldPrice
    };
  } else {
    publicData.currentPlayer = null;
  }

  if (state.currentBiddingTeam) {
    publicData.currentBiddingTeam = {
      _id: state.currentBiddingTeam._id,
      name: state.currentBiddingTeam.name,
      logo: state.currentBiddingTeam.logo
      // Explicitly NO budget or remainingBalance
    };
  } else {
    publicData.currentBiddingTeam = null;
  }

  return publicData;
};

module.exports = { sanitizeForPublic };
