-- CreateEnum
CREATE TYPE "user_type" AS ENUM ('user', 'speaker');

-- CreateTable
CREATE TABLE "Users" (
    "user_id" SERIAL NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "user_type" "user_type" NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Speakers" (
    "speaker_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expertise" TEXT,
    "session_cost" DECIMAL(65,30),

    CONSTRAINT "Speakers_pkey" PRIMARY KEY ("speaker_id")
);

-- CreateTable
CREATE TABLE "Slots" (
    "slot_id" SERIAL NOT NULL,
    "speaker_id" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "is_booked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Slots_pkey" PRIMARY KEY ("slot_id")
);

-- CreateTable
CREATE TABLE "Bookings_table" (
    "booking_id" SERIAL NOT NULL,
    "slot_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "booking_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookings_table_pkey" PRIMARY KEY ("booking_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Speakers_user_id_key" ON "Speakers"("user_id");

-- AddForeignKey
ALTER TABLE "Speakers" ADD CONSTRAINT "Speakers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slots" ADD CONSTRAINT "Slots_speaker_id_fkey" FOREIGN KEY ("speaker_id") REFERENCES "Speakers"("speaker_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookings_table" ADD CONSTRAINT "Bookings_table_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "Slots"("slot_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookings_table" ADD CONSTRAINT "Bookings_table_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
