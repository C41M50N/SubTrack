import type { User } from '@prisma/client';
import { prisma } from '@/server/db';

type InitializeUserDataProps = {
  userId: User['id'];
};

export default async function initializeUserData(
  input: InitializeUserDataProps
) {
  // create default categories
  await prisma.categoryList.create({
    data: {
      user_id: input.userId,
    },
  });

  // create default collection
  await prisma.collection.create({
    data: {
      title: 'Personal',
      user_id: input.userId,
    },
  });
}
