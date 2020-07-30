FROM node:12

ADD . /oauth20
WORKDIR /oauth20


RUN yarn add global yarn \
&& yarn install \
&& yarn cache clean


EXPOSE 9003

CMD ["yarn", "start"]

