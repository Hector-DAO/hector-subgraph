import {
    SPOOKY_HECDAI_PAIR,
    SPOOKY_USDC_FTM_PAIR,
} from './Constants'
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { UniswapV2Pair } from '../../generated/HectorStakingV1/UniswapV2Pair';
import { toDecimal } from './Decimals'


let BIG_DECIMAL_1E9 = BigDecimal.fromString('1e9')
let BIG_DECIMAL_1E12 = BigDecimal.fromString('1e12')

export function getFTMUSDRate(): BigDecimal {
    let pair = UniswapV2Pair.bind(Address.fromString(SPOOKY_USDC_FTM_PAIR))

    let reserves = pair.getReserves()
    let reserve0 = reserves.value0.toBigDecimal()
    let reserve1 = reserves.value1.toBigDecimal()

    let ftmRate = reserve0.div(reserve1).times(BIG_DECIMAL_1E12)
    log.debug("FTM rate {}", [ftmRate.toString()])
    
    return ftmRate
}

export function getHECUSDRate(): BigDecimal {
    let pair = UniswapV2Pair.bind(Address.fromString(SPOOKY_HECDAI_PAIR))

    let reserves = pair.getReserves()
    let reserve0 = reserves.value0.toBigDecimal()
    let reserve1 = reserves.value1.toBigDecimal()

    let hecRate = reserve1.div(reserve0).div(BIG_DECIMAL_1E9)
    log.debug("HEC rate {}", [hecRate.toString()])

    return hecRate
}

//(slp_treasury/slp_supply)*(2*sqrt(lp_dai * lp_ohm))
export function getDiscountedPairUSD(lp_amount: BigInt, pair_adress: string, getReserves: (pair: UniswapV2Pair) => BigDecimal[]): BigDecimal{
    let pair = UniswapV2Pair.bind(Address.fromString(pair_adress))

    let total_lp = pair.totalSupply()
    let reserves = getReserves(pair)
    let lp_token_1 = reserves[0]
    let lp_token_2 = reserves[1]
    let kLast = lp_token_1.times(lp_token_2).truncate(0).digits

    let part1 = toDecimal(lp_amount,18).div(toDecimal(total_lp,18))
    let two = BigInt.fromI32(2)

    let sqrt = kLast.sqrt();
    let part2 = toDecimal(two.times(sqrt), 0)
    let result = part1.times(part2)
    return result
}

export function getPairUSD(lp_amount: BigInt, pair_adress: string, getReserves: (pair: UniswapV2Pair) => BigDecimal[]): BigDecimal{
    let pair = UniswapV2Pair.bind(Address.fromString(pair_adress))
    let total_lp = pair.totalSupply()
    let reserves = getReserves(pair)
    let lp_token_0 = reserves[0]
    let lp_token_1 = reserves[1]
    let ownedLP = toDecimal(lp_amount,18).div(toDecimal(total_lp,18))
    let ohm_value = lp_token_0.times(getHECUSDRate())
    let total_lp_usd = ohm_value.plus(lp_token_1)

    return ownedLP.times(total_lp_usd)
}