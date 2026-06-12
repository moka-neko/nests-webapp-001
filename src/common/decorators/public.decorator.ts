import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants';

/** JWT 認証をスキップするエンドポイントに付与する */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
