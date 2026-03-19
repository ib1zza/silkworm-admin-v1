import type { AuthResponseDto } from '../../api/model'
import type { AuthSession } from './store'

export const mapAuthResponseToSession = (
  response: AuthResponseDto,
): AuthSession => {
  return {
    accessToken: response.AccessToken,
    refreshToken: response.RefreshToken,
    user: {
      Id: response.User.Id,
      Email: response.User.Email,
      Name: response.User.Name,
    },
  }
}
