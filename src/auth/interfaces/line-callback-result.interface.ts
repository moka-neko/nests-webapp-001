import { LineCallbackResponseDto } from '../dto/line-callback-response.dto';

export interface LineCallbackResult extends LineCallbackResponseDto {
  returnUrl?: string;
}
