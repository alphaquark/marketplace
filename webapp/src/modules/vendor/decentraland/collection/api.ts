import { gql } from 'apollo-boost'

import { NFTsFetchParams } from '../../../nft/types'
import { WearableGender } from '../../../nft/wearable/types'
import { ContractService, ContractName } from '../ContractService'
import { collectionsClient } from '../api'
import {
  nftFragment,
  NFTFragment,
  collectionFragment,
  CollectionFragment
} from './fragments'
import { NFTsFetchFilters } from './types'

class CollectionAPI {
  fetch = async () => {
    const { data } = await collectionsClient.query<{
      collections: CollectionFragment[]
    }>({ query: COLLECTIONS_QUERY })

    return data.collections
  }

  fetchNFTs = async (params: NFTsFetchParams, filters?: NFTsFetchFilters) => {
    const query = getNFTsQuery(params, filters)
    const variables = this.buildFetchVariables(params, filters)

    const { data } = await collectionsClient.query<{ nfts: NFTFragment[] }>({
      query,
      variables
    })

    return data.nfts
  }

  async countNFTs(params: NFTsFetchParams, filters?: NFTsFetchFilters) {
    const countQuery = getNFTsCountQuery(params, filters)
    const variables = this.buildFetchVariables(params, filters)

    const { data } = await collectionsClient.query<{ nfts: NFTFragment[] }>({
      query: countQuery,
      variables
    })

    return data.nfts.length
  }

  async fetchOneNFT(contractAddress: string, tokenId: string) {
    const { data } = await collectionsClient.query<{ nfts: NFTFragment[] }>({
      query: NFT_BY_ADDRESS_AND_ID_QUERY,
      variables: {
        contractAddress,
        tokenId
      }
    })
    return data.nfts[0]
  }

  private buildFetchVariables(
    params: NFTsFetchParams,
    filters?: NFTsFetchFilters
  ) {
    return {
      ...params,
      ...filters,
      expiresAt: Date.now().toString()
    }
  }
}

const NFTS_FILTERS = `
  $first: Int
  $skip: Int
  $orderBy: String
  $orderDirection: String

  $expiresAt: String
  $address: String
  $wearableCategory: String
  $isWearableHead: Boolean
  $isWearableAccessory: Boolean
`

const NFTS_ARGUMENTS = `
  first: $first
  skip: $skip
  orderBy: $orderBy
  orderDirection: $orderDirection
`

function getNFTsCountQuery(
  params: NFTsFetchParams,
  filters: NFTsFetchFilters = {}
) {
  return getNFTsQuery(params, filters, true)
}

function getNFTsQuery(
  params: NFTsFetchParams,
  filters: NFTsFetchFilters = {},
  isCount = false
) {
  let extraWhere: string[] = []

  if (params.address) {
    extraWhere.push('owner: $address')
  }

  if (params.onlyOnSale) {
    extraWhere.push('searchOrderStatus: open')
    extraWhere.push('searchOrderExpiresAt_gt: $expiresAt')
  }

  if (params.search) {
    extraWhere.push(
      `searchText_contains: "${params.search.trim().toLowerCase()}"`
    )
  }

  if (filters.wearableCategory) {
    extraWhere.push('searchWearableCategory: $wearableCategory')
  }

  if (filters.isWearableHead) {
    extraWhere.push('searchIsWearableHead: $isWearableHead')
  }

  if (filters.isWearableAccessory) {
    extraWhere.push('searchIsWearableAccessory: $isWearableAccessory')
  }

  if (filters.wearableRarities && filters.wearableRarities.length > 0) {
    extraWhere.push(
      `searchWearableRarity_in: [${filters.wearableRarities
        .map(rarity => `"${rarity}"`)
        .join(',')}]`
    )
  }

  if (filters.wearableGenders && filters.wearableGenders.length > 0) {
    const hasMale = filters.wearableGenders.includes(WearableGender.MALE)
    const hasFemale = filters.wearableGenders.includes(WearableGender.FEMALE)

    if (hasMale && !hasFemale) {
      extraWhere.push(`searchWearableBodyShapes: [BaseMale]`)
    } else if (hasFemale && !hasMale) {
      extraWhere.push(`searchWearableBodyShapes: [BaseFemale]`)
    } else if (hasMale && hasFemale) {
      extraWhere.push(
        `searchWearableBodyShapes_contains: [BaseMale, BaseFemale]`
      )
    }
  }

  if (filters.contracts && filters.contracts.length > 0) {
    const { contractAddresses } = ContractService
    extraWhere.push(
      `contractAddress_in: [${filters.contracts
        .map(contract => `"${contractAddresses[contract as ContractName]}"`)
        .join(', ')}]`
    )
  }

  return gql`
    query NFTs(
      ${NFTS_FILTERS}
    ) {
      nfts(
        where: {
          ${extraWhere.join('\n')}
        }
        ${NFTS_ARGUMENTS}
      ) {
        ${isCount ? 'id' : '...nftFragment'}
      }
    }
    ${isCount ? '' : nftFragment()}
  `
}

const NFT_BY_ADDRESS_AND_ID_QUERY = gql`
  query NFTByTokenId($contractAddress: String, $tokenId: String) {
    nfts(
      where: { contractAddress: $contractAddress, tokenId: $tokenId }
      first: 1
    ) {
      ...nftFragment
    }
  }
  ${nftFragment()}
`

const COLLECTIONS_QUERY = gql`
  query Collections {
    collections {
      ...collectionFragment
    }
  }
  ${collectionFragment()}
`

export const collectionAPI = new CollectionAPI()