import DynamicDataView from './dynamic-data-view';
import Engine from './engine/engine';
import ReverseIndex from './engine/reverse-index';
import { CosmeticFilter } from './parsing/cosmetic-filter';
import IFilter from './parsing/interface';
import { NetworkFilter } from './parsing/network-filter';
declare function serializeNetworkFilter(filter: NetworkFilter, buffer: DynamicDataView): void;
declare function deserializeNetworkFilter(buffer: DynamicDataView): NetworkFilter;
declare function serializeCosmeticFilter(filter: CosmeticFilter, buffer: DynamicDataView): void;
declare function deserializeCosmeticFilter(buffer: DynamicDataView): CosmeticFilter;
declare function serializeReverseIndex<T extends IFilter>(reverseIndex: ReverseIndex<T>, buffer: DynamicDataView): void;
declare function deserializeReverseIndex<T extends IFilter>(buffer: DynamicDataView, index: ReverseIndex<T>, filters: Map<number, T>): ReverseIndex<T>;
declare function serializeEngine(engine: Engine): Uint8Array;
declare function deserializeEngine(serialized: Uint8Array, version: number): Engine;
export { IFilter, serializeNetworkFilter, deserializeNetworkFilter, serializeCosmeticFilter, deserializeCosmeticFilter, serializeReverseIndex, deserializeReverseIndex, serializeEngine, deserializeEngine, };
