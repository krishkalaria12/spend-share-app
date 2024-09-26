import onboarding1 from "@/assets/images/onboarding-01.png";
import onboarding2 from "@/assets/images/onboarding-02.png";
import onboarding3 from "@/assets/images/onboarding-03.jpg";
import signUpImage from "@/assets/images/sign-up.jpg";
import groupNotFound from "@/assets/images/group.jpg"

import lock from "@/assets/icons/lock.png";
import person from "@/assets/icons/person.png";
import email from "@/assets/icons/email.png";
import google from "@/assets/icons/google.png";
import check from "@/assets/icons/check.png";
import expense from "@/assets/icons/expense.png";
import friend from "@/assets/icons/friend.png";
import group from "@/assets/icons/group.png";
import askFriend from "@/assets/icons/askFriend.png";
import feedback from "@/assets/icons/feedback.png";
import friends from "@/assets/images/friend.png";

export const images = {
  onboarding1,
  onboarding2,
  onboarding3,
  signUpImage,
  groupNotFound,
  friends
};

export const icons = {
  lock,
  person,
  email,
  google,
  check,
  expense,
  friend,
  group,
  askFriend,
  feedback
}

export const onboarding = [
  {
    id: 1,
    title: "Effortless Expense Tracking",
    description: "Simplify expense management with Spend Share. Track and share costs easily within your group.",
    image: images.onboarding1,
  },
  {
    id: 2,
    title: "Organize Your Finances",
    description: "Create groups, record transactions, and generate detailed reports for better financial oversight.",
    image: images.onboarding2,
  },
  {
    id: 3,
    title: "Secure and User-Friendly",
    description: "Enjoy a secure and intuitive experience with Spend Share. Our user-friendly interface makes it easy for anyone to use.",
    image: images.onboarding3,
  },
];

export const data = {
  onboarding,
};