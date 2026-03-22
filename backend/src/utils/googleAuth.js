import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.model.js";

// Google profile photos come as:
// https://lh3.googleusercontent.com/a/photo.jpg=s96-c
// The =s96-c suffix sets size to 96px. We remove it to get the full size photo.
const getGooglePhotoUrl = (profile) => {
    const raw = profile.photos?.[0]?.value;
    if (!raw) return "";
    // Remove Google's size/crop suffix (=s96-c, =s100, etc.)
    return raw.replace(/=s\d+(-c)?$/, "=s400-c"); // request 400px — good quality, not huge
};

passport.use(
    new GoogleStrategy(
        {
            clientID:     process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL:  process.env.GOOGLE_CALLBACK_URL ||
                          "http://localhost:5000/api/v1/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email    = profile.emails?.[0]?.value;
                const googleId = profile.id;
                const fullName = profile.displayName;
                const avatar   = getGooglePhotoUrl(profile); // ← proper sized URL

                if (!email) {
                    return done(new Error("No email returned from Google. Please allow email access."), null);
                }

                // 1. Existing Google user — update their photo in case it changed
                let user = await User.findOne({ googleId });
                if (user) {
                    // Keep Google photo fresh on every login
                    if (avatar && user.avatar !== avatar) {
                        user.avatar = avatar;
                        await user.save({ validateBeforeSave: false });
                    }
                    return done(null, user);
                }

                // 2. Local account with same email — merge, link Google ID
                user = await User.findOne({ email });
                if (user) {
                    user.googleId     = googleId;
                    user.authProvider = "google";
                    // Only overwrite avatar if the local user has none
                    if ((!user.avatar || user.avatar === "") && avatar) {
                        user.avatar = avatar;
                    }
                    await user.save({ validateBeforeSave: false });
                    return done(null, user);
                }

                // 3. Brand new user — create account from Google profile
                const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
                let username = baseUsername;
                let counter  = 1;
                while (await User.findOne({ username })) {
                    username = `${baseUsername}${counter++}`;
                }

                const newUser = await User.create({
                    googleId,
                    authProvider: "google",
                    email,
                    fullName,
                    username,
                    avatar,           // Google profile photo
                    role:       "student",
                    isApproved: true, // Google-verified email = trusted
                    status:     "approved",
                });

                return done(null, newUser);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

export default passport;
