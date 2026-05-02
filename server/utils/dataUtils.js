// server/utils/dataUtils.js

/**
 * Removes duplicate x-values from a graph data object,
 * keeping only the first occurrence of each label.
 * @param {Object} graphData - { labels: number[], userSteps: {x: number, y: number}[] }
 * @returns {Object} filtered data with unique labels and corresponding steps.
 */

function removeRedundantXValues(graphData) {
  const seenXValues = new Set();
  const uniqueLabels = [];
  const uniqueUserSteps = [];

  for (let i = 0; i < graphData.labels.length; i++) {
    const label = graphData.labels[i];
    const userStep = graphData.userSteps[i];

    if (!seenXValues.has(label)) {
      seenXValues.add(label);
      uniqueLabels.push(label);
      uniqueUserSteps.push(userStep);
    }
  }

  return {
    labels: uniqueLabels,
    userSteps: uniqueUserSteps,
  };
}

module.exports = { removeRedundantXValues };