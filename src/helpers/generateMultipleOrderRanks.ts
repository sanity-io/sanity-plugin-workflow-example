import {LexoRank} from 'lexorank'

function generateMiddleValue(ranks: (LexoRank | undefined)[]) {
  // Has no undefined values
  if (!ranks.some((rank) => !rank)) {
    return ranks
  }

  // Find the first undefined value
  const firstUndefined = ranks.findIndex((rank) => !rank)

  // Find the first defined value after the undefined value
  const firstDefinedAfter = ranks.findIndex(
    (rank, index) => rank && index > firstUndefined
  )
  // Find the first defined value before the undefined value
  const firstDefinedBefore = ranks.findLastIndex(
    (rank, index) => rank && index < firstUndefined
  )

  if (firstDefinedAfter === -1 || firstDefinedBefore === -1) {
    throw new Error(
      `Unable to generate middle value between indexes ${firstDefinedBefore} and ${firstDefinedAfter}`
    )
  }

  const beforeRank = ranks[firstDefinedBefore]
  const afterRank = ranks[firstDefinedAfter]

  if (
    !beforeRank ||
    typeof beforeRank === 'undefined' ||
    !afterRank ||
    typeof afterRank === 'undefined'
  ) {
    throw new Error(
      `Unable to generate middle value between indexes ${firstDefinedBefore} and ${firstDefinedAfter}`
    )
  }

  // Generate a new value between the two
  const between = beforeRank.between(afterRank)

  // Calculate the middle index between the defined values
  const middle = Math.floor((firstDefinedAfter + firstDefinedBefore) / 2)

  if (ranks[middle]) {
    throw new Error(`Should not have overwritten value at index ${middle}`)
  }

  // Insert the new value into the array
  ranks[middle] = between

  // Return as a new array
  return ranks
}

// Generates an array of LexoRanks between two values
export function generateMultipleOrderRanks(
  count: number,
  start?: LexoRank,
  end?: LexoRank
): LexoRank[] {
  // Begin array with correct size
  let ranks = [...Array(count)]

  // Use or create default values
  const rankStart = start ?? LexoRank.min().genNext().genNext()
  const rankEnd = end ?? LexoRank.max().genPrev().genPrev()

  ranks[0] = rankStart
  ranks[count - 1] = rankEnd

  // Keep processing the array until every value between undefined values is defined
  for (let i = 0; i < count; i++) {
    ranks = generateMiddleValue(ranks)
  }

  return ranks.sort((a, b) => a.toString().localeCompare(b.toString()))
}
