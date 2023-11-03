import { PrismaClient } from '@prisma/client';
import { enhance } from '@zenstackhq/runtime';

const prisma = new PrismaClient();

// A `main` function so that we can use async/await
async function main() {
    // clean up
    await prisma.role.deleteMany();
    await prisma.user.deleteMany();
    await prisma.post.deleteMany();

    // read a reader role
    const readerRole = await prisma.role.create({
        data: {
            name: 'Reader',
            permission: 'READ',
        },
    });

    // create a writer role
    const writerRole = await prisma.role.create({
        data: {
            name: 'Admin',
            permission: 'WRITE',
        },
    });

    // create a reader user
    const readerUser = await prisma.user.create({
        data: {
            email: 'user1@abc.com',
            roles: { connect: { id: readerRole.id } },
        },
        include: { roles: true },
    });

    // create an admin user
    const adminUser = await prisma.user.create({
        data: {
            email: 'user2@abc.com',
            roles: { connect: [{ id: readerRole.id }, { id: writerRole.id }] },
        },
        include: { roles: true },
    });

    // create a post
    const post = await prisma.post.create({
        data: { title: 'Post1' },
    });

    // reader can't update posts
    const dbReaderUser = enhance(prisma, {
        user: await getUserWithPermission(readerUser.id),
    });
    try {
        await dbReaderUser.post.update({
            where: { id: post.id },
            data: { title: 'new title' },
        });
    } catch (err: any) {
        console.log('Failed to update post with readerUser:', err.message);
    }

    // admin can update posts
    const dbAdminUser = enhance(prisma, {
        user: await getUserWithPermission(adminUser.id),
    });
    const r = await dbAdminUser.post.update({
        where: { id: post.id },
        data: { title: 'another new title' },
    });
    console.log('Updated post with adminUser', r);
}

async function getUserWithPermission(id: number) {
    const user = await prisma.user.findUniqueOrThrow({
        where: { id },
        include: { roles: true },
    });

    return {
        id: user.id,
        hasWritePermission: user.roles.some((r) => r.permission === 'WRITE'),
    };
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
