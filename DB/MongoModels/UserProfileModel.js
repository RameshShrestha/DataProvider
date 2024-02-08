const mongoose = require('mongoose');
const RegisteredUser = require("./RegisteredUserModel");



const userProfileSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      default: "",
    },
    firstName: {
      type: String,
      default: "",
    },
    lastName: {
      type: String,
      default: "",
    },
    maidenName: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: "USER",
    },
    age: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    birthDate: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "/dummyUser.PNG",
    },
    bloodGroup: {
      type: String,
      default: "",
    },
    height: {
      type: String,
      default: "",
    },
    weight: {
      type: String,
      default: "",
    },
    eyeColor: {
      type: String,
      default: "",
    },
    hair: {
      color: {
        type: String,
        default: "",
      },
      type: {
        type: String,
        default: "",
      },
    },
    domain: {
      type: String,
      default: "",
    },
    ip: {
      type: String,
      default: "",
    },
    address: {
      address: {
        type: String,
        default: "",
      },
      city: {
        type: String,
        default: "",
      },
      coordinates: {
        lat: {
          type: String,
          default: "",
        },
        lng: {
          type: String,
          default: "",
        },
      },
      postalCode: {
        type: String,
        default: "",
      },
      state: {
        type: String,
        default: "",
      },
    },
    university: {
      type: String,
      default: "",
    },
    bank: {
      cardExpire: {
        type: String,
        default: "",
      },
      cardNumber: {
        type: String,
        default: "",
      },
      cardType: {
        type: String,
        default: "",
      },
      currency: {
        type: String,
        default: "",
      },
      iban: {
        type: String,
        default: "",
      },
    },
    company: {
      address: {
        address: {
          type: String,
          default: "",
        },
        city: {
          type: String,
          default: "",
        },
        coordinates: {
          lat: {
            type: String,
            default: "",
          },
          lng: {
            type: String,
            default: "",
          },
        },
        postalCode: {
          type: String,
          default: "",
        },
        state: {
          type: String,
          default: "",
        },
      },
      department: {
        type: String,
        default: "",
      },
      name: {
        type: String,
        default: "",
      },
      title: {
        type: String,
        default: "",
      },
    },
    ein: {
      type: String,
      default: "",
    },
    ssn: {
      type: Date,
      default: null,
    },
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RegisteredUser",
      unique: true,
    },
  },
  { timestamps: true }
);

const UserProfile = mongoose.model("UserProfile", userProfileSchema);
module.exports = { UserProfile };