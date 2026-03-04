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
        website
        companyRegistrationNumber
        phoneIsWhatsApp
        showPhone
        showContactPhone
        gender
        dateOfBirth
        createdAt
        updatedAt
        warningCount
        currentWarningMessage
        warningAcknowledged
        bannedUntil
        banReason
      }
      tokenExpiresAt
    }
    myPackage {
      id
      status
      startDate
      endDate
      currentListings
      userSubscription {
        id
        name
        title
        description
        monthlyPrice
        yearlyPrice
        maxListings
        maxImagesPerListing
        videoAllowed
        priorityPlacement
        analyticsAccess
        customBranding
        featuredListings
      }
    }
  }
`;

export const UPDATE_ME_MUTATION = `
  mutation UpdateMe($input: UpdateUserInput!) {
    updateMe(input: $input) {
      id
      name
      phone
      phoneIsWhatsApp
      showPhone
      showContactPhone
      companyName
      contactPhone
      website
      companyRegistrationNumber
      gender
      dateOfBirth
      avatar
      updatedAt
    }
  }
`;

// Request password reset email
export const REQUEST_PASSWORD_RESET_MUTATION = `
  mutation RequestPasswordReset($input: RequestLinkInput!) {
    requestPasswordReset(input: $input)
  }
`;

// Change email mutation
export const CHANGE_EMAIL_MUTATION = `
  mutation ChangeMyEmail($input: ChangeEmailInput!) {
    changeMyEmail(input: $input)
  }
`;

// Avatar mutations
export const CREATE_AVATAR_UPLOAD_URL_MUTATION = `
  mutation CreateAvatarUploadUrl {
    createAvatarUploadUrl {
      uploadUrl
    }
  }
`;

export const DELETE_AVATAR_MUTATION = `
  mutation DeleteAvatar {
    deleteAvatar
  }
`;
