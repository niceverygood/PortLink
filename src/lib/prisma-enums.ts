/**
 * Prisma enum identifier ↔ wire value(@map) 매핑.
 *
 * Prisma 6에서 client가 export하는 enum value는 식별자(예: `FORTY_FT_HC`),
 * DB에 저장되는 값은 schema의 `@map` value(예: `40FT_HC`).
 * UI/JSON/business-rules는 wire value를 사용하므로 변환 헬퍼 1곳에서 관리.
 */
import { ContainerType } from '@prisma/client';

export const CONTAINER_TYPE_TO_WIRE: Record<ContainerType, '20FT' | '40FT' | '40FT_HC'> = {
  [ContainerType.TWENTY_FT]: '20FT',
  [ContainerType.FORTY_FT]: '40FT',
  [ContainerType.FORTY_FT_HC]: '40FT_HC',
};

export const WIRE_TO_CONTAINER_TYPE: Record<'20FT' | '40FT' | '40FT_HC', ContainerType> = {
  '20FT': ContainerType.TWENTY_FT,
  '40FT': ContainerType.FORTY_FT,
  '40FT_HC': ContainerType.FORTY_FT_HC,
};

/** UI 표시용. CLAUDE.md §1.4 표기는 `40HC` */
export const CONTAINER_TYPE_LABEL: Record<ContainerType, string> = {
  [ContainerType.TWENTY_FT]: '20FT',
  [ContainerType.FORTY_FT]: '40FT',
  [ContainerType.FORTY_FT_HC]: '40HC',
};
