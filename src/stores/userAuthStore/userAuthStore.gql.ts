/**
 * GraphQL queries for user authentication
 * COPIED FROM WEB FRONTEND - Matching exact pattern
 */

export const ME_QUERY = `
  query Me {
    me {
      user {
        id
        email
        name
        phone
        role
        accountType
        status
        avatar
        companyName
        accountBadge
        businessVerified
        contactPhone
        phoneIsWhatsApp
        showPhone
        showContactPhone
        createdAt
        updatedAt
        warningCount
        currentWarningMessage
        warningAcknowledged
        bannedUntil
        banReason
      }
    }
  }
`;
