import React from 'react'
import { Table } from 'decentraland-ui'
import { Mana } from '../Mana'
import { Network, NFTCategory, Rarity } from '@dcl/schemas'
import { formatMANA } from '../../lib/mana'
import { t } from 'decentraland-dapps/dist/modules/translation/utils'
import userSVG from '../../images/user.svg'

type Base = {
  title: string
  subtitle?: string
  saleType: 'primary' | 'secondary'
  network: Network
  price: string
}

type Wearable = Base & {
  type: NFTCategory.WEARABLE
  rarity: Rarity
  src: string
}

type Other = Base & {
  type: NFTCategory.PARCEL | NFTCategory.ESTATE | NFTCategory.ENS
}

type Item = Wearable | Other

type Props = {
  items: Item[]
}

const OnSaleList = ({ items }: Props) => {
  return (
    <div>
      <Table basic="very">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Item</Table.HeaderCell>
            <Table.HeaderCell>Type</Table.HeaderCell>
            <Table.HeaderCell>Sale type</Table.HeaderCell>
            <Table.HeaderCell>Sell price</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items.map(item => {
            const backgroundImage = (() => {
              if (item.type !== NFTCategory.WEARABLE) {
                return undefined
              }
              const [light, dark] = Rarity.getGradient(Rarity.MYTHIC)
              return `radial-gradient(${light}, ${dark})`
            })()

            const img = (() => {
              switch (item.type) {
                case NFTCategory.WEARABLE:
                  return (
                    <img
                      src={item.src}
                      height={40.19}
                      width={40.19}
                      alt="foo"
                    />
                  )
                case NFTCategory.ENS:
                  return <img src={userSVG} alt="foo" />
                case NFTCategory.PARCEL:
                  return (
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        backgroundColor: '#FF2D55'
                      }}
                    />
                  )
                case NFTCategory.ESTATE:
                  return (
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        backgroundColor: '#FF2D55'
                      }}
                    />
                  )
              }
            })()

            return (
              <Table.Row>
                <Table.Cell>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <div
                      style={{
                        marginRight: '1rem',
                        borderRadius: 4,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 48,
                        height: 48,
                        backgroundColor: '#242129',
                        backgroundImage
                      }}
                    >
                      {img}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.title}</div>
                      {item.subtitle && <div>{item.subtitle}</div>}
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>{t(`global.${item.type}`)}</Table.Cell>
                <Table.Cell>{t(`global.${item.saleType}`)}</Table.Cell>
                <Table.Cell>
                  <Mana network={item.network} inline>
                    {formatMANA(item.price)}
                  </Mana>
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table>
    </div>
  )
}

export default React.memo(OnSaleList)
