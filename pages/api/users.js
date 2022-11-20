// pages/api/hello.js
import { createRouter } from "next-connect";
import prisma from "@/prisma";
import z from "zod";

// Default Req and Res are IncomingMessage and ServerResponse
// You may want to pass in NextApiRequest and NextApiResponse
const router = createRouter();

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(3),
});

router
  .use(async (req, res, next) => {
    // tracking example
    const start = Date.now();
    await next(); // call next in chain
    const end = Date.now();
    console.log(`Request took ${end - start}ms`);
  })
  .get(async (req, res) => {
    const users = await prisma.user.findMany({
      include: {
        posts: true,
      },
    });

    res.send({ data: users });
  })
  .post(async (req, res) => {
    // validation
    const response = userSchema.safeParse(req.body);

    if (!response.success) {
      return res.status(409).send({
        message: `Invalid arguments!`,
      });
    }

    // check if user already exists
    if (
      !!(await prisma.user.findUnique({
        where: {
          email: response.data.email,
        },
      }))
    ) {
      return res.status(409).send({
        message: `User already exists!`,
      });
    }

    const user = await prisma.user.create({ data: response.data });

    res.send({ data: user });
  })
  .put(async (req, res) => {
    // validation
    const response = userSchema.safeParse(req.body);

    if (!response.success) {
      return res.status(409).send({
        message: `Invalid arguments!`,
      });
    }

    // check if user exists
    if (
      !(await prisma.user.findUnique({
        where: {
          email: response.data.email,
        },
      }))
    ) {
      return res.status(409).send({
        message: `User not found!`,
      });
    }

    const user = await prisma.user.update({
      where: {
        email: response.data.email,
      },
      data: {
        name: response.data.name,
      },
    });

    res.send({ data: user });
  });

// create a handler from router with custom
// onError and onNoMatch
export default router.handler({
  onError: (err, req, res) => {
    console.error(err.stack);
    res.status(500).end("Something broke!");
  },
  onNoMatch: (req, res) => {
    res.status(404).end("Page not found");
  },
});
