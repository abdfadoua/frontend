import { atom } from "recoil";

export const signupState = atom({
    key: 'signupState', // unique ID (with respect to other atoms/selectors)
    default: {
        name: "",
        userName: "",
        phone: "",
        email: "",
        password: "",
        userType: "Student",
        lastSeen: [],
        domain : [],
        otherDomain : "",
        level: [],
        preferences: [],
        otherPreferences: "",
        goals: [],
        otherGoals: "",
        confirmPassword: "",
        
    }, // default value (aka initial value)
});